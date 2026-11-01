param(
    [Parameter(Mandatory = $true)]
    [ValidateSet('Review', 'Install')]
    [string]$Action,
    [string]$CandidatePath,
    [string]$Name,
    [ValidateSet('Team', 'Personal')]
    [string]$Scope,
    [string]$ReviewId,
    [switch]$ManualReviewComplete
)

$ErrorActionPreference = 'Stop'
$featureRoot = Split-Path -Parent $PSScriptRoot
$coreRoot = Split-Path -Parent $featureRoot
$helper = Join-Path $coreRoot 'tools/Setup-MemoryCore.ps1'
$reviewsRoot = Join-Path $coreRoot '.runtime/skill-reviews'
$utf8 = New-Object System.Text.UTF8Encoding($false)

function Read-JsonFile([string]$path) {
    return (Get-Content -LiteralPath $path -Raw -Encoding UTF8 | ConvertFrom-Json)
}

function Write-JsonFile([string]$path, $value) {
    [System.IO.File]::WriteAllText($path, (($value | ConvertTo-Json -Depth 40) + [Environment]::NewLine), $utf8)
}

function Get-CandidateSnapshot([string]$path) {
    if (-not (Test-Path -LiteralPath $path)) { throw "Candidate not found: $path" }
    $resolved = (Resolve-Path -LiteralPath $path).Path
    $item = Get-Item -LiteralPath $resolved -Force
    $resolved = $item.FullName.TrimEnd('\')
    if ($item.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
        throw 'Skill candidate cannot be a symbolic link or junction.'
    }
    if ($item.PSIsContainer) {
        if (-not (Test-Path -LiteralPath (Join-Path $resolved 'SKILL.md') -PathType Leaf)) {
            throw 'Candidate directory must contain SKILL.md.'
        }
        $allItems = @(Get-ChildItem -LiteralPath $resolved -Recurse -Force)
        foreach ($child in $allItems) {
            if ($child.Attributes -band [System.IO.FileAttributes]::ReparsePoint) {
                throw "Skill candidate contains a link or junction: $($child.FullName)"
            }
        }
        $files = @($allItems | Where-Object { -not $_.PSIsContainer } | Sort-Object FullName)
    } else {
        if ($item.Name -ne 'SKILL.md') { throw 'A single-file candidate must be named SKILL.md.' }
        $files = @($item)
    }
    $hashes = @()
    foreach ($file in $files) {
        $relative = if ($item.PSIsContainer) {
            $file.FullName.Substring($resolved.Length + 1).Replace('\', '/')
        } else { 'SKILL.md' }
        $hashes += [pscustomobject]@{
            path = $relative
            sha256 = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash.ToLowerInvariant()
        }
    }
    return [pscustomobject]@{ source = $resolved; is_directory = [bool]$item.PSIsContainer; files = $hashes }
}

function Get-ScannerPath {
    $status = & (Join-Path $coreRoot 'tools/Setup-Tools.ps1') | ConvertFrom-Json
    return $status.skillspector
}

if ($Action -eq 'Review') {
    if ([string]::IsNullOrWhiteSpace($Name) -or $Name -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,63}$') {
        throw 'Name must contain 1-64 letters, digits, or hyphens and start with a letter or digit.'
    }
    if ([string]::IsNullOrWhiteSpace($Scope)) { throw 'Scope Team or Personal is required.' }
    if ([string]::IsNullOrWhiteSpace($CandidatePath)) { throw 'CandidatePath is required.' }
    $snapshot = Get-CandidateSnapshot $CandidatePath
    New-Item -ItemType Directory -Path $reviewsRoot -Force | Out-Null
    $id = [guid]::NewGuid().ToString('N')
    $reportPath = Join-Path $reviewsRoot "$id.report.json"
    $scanner = Get-ScannerPath
    & $scanner scan $snapshot.source --no-llm --format json --output $reportPath | Out-Null
    $exitCode = $LASTEXITCODE
    $afterScan = Get-CandidateSnapshot $snapshot.source
    if (($snapshot.files | ConvertTo-Json -Depth 5 -Compress) -ne ($afterScan.files | ConvertTo-Json -Depth 5 -Compress)) {
        throw 'Candidate changed during scanning. Run Review again on a stable copy.'
    }
    if ($exitCode -eq 2 -or -not (Test-Path -LiteralPath $reportPath)) {
        throw "SkillSpector did not produce a valid report (exit code $exitCode)."
    }
    $report = Read-JsonFile $reportPath
    if ($null -eq $report.risk_assessment -or $null -eq $report.issues) {
        throw 'SkillSpector report is incomplete.'
    }
    $manifest = [pscustomobject]@{
        review_id = $id
        reviewed_at = [DateTimeOffset]::UtcNow.ToString('o')
        candidate = $snapshot.source
        is_directory = $snapshot.is_directory
        name = $Name
        scope = $Scope
        files = $snapshot.files
        scanner_exit_code = $exitCode
        score = $report.risk_assessment.score
        recommendation = $report.risk_assessment.recommendation
        findings = @($report.issues).Count
        high_findings = @($report.issues | Where-Object { $_.severity -in @('HIGH', 'CRITICAL') }).Count
        scan_mode = if ($report.metadata.llm_requested) { 'llm' } else { 'static' }
    }
    Write-JsonFile (Join-Path $reviewsRoot "$id.review.json") $manifest
    [pscustomobject]@{
        review_id = $id
        name = $Name
        scope = $Scope
        recommendation = $manifest.recommendation
        score = $manifest.score
        findings = $manifest.findings
        high_findings = $manifest.high_findings
        scan_mode = $manifest.scan_mode
        report_file = $reportPath
        next_step = 'Read the full report and inspect files manually before Install.'
    } | ConvertTo-Json -Depth 10
    return
}

if ($ReviewId -notmatch '^[0-9a-f]{32}$') { throw 'A valid ReviewId is required for Install.' }
if (-not $ManualReviewComplete) { throw 'Manual review is required. Use -ManualReviewComplete only after reading the report and candidate files.' }
$reviewPath = Join-Path $reviewsRoot "$ReviewId.review.json"
if (-not (Test-Path -LiteralPath $reviewPath)) { throw 'Review not found. Run Review first.' }
$review = Read-JsonFile $reviewPath
if ($review.review_id -ne $ReviewId) { throw 'Review ID mismatch.' }
if ($review.name -notmatch '^[A-Za-z0-9][A-Za-z0-9-]{0,63}$' -or $review.scope -notin @('Team','Personal')) { throw 'Invalid name or scope in review manifest.' }
$report = Read-JsonFile (Join-Path $reviewsRoot "$ReviewId.report.json")
if ($report.risk_assessment.recommendation -ne $review.recommendation -or @($report.issues | Where-Object { $_.severity -in @('HIGH','CRITICAL') }).Count -gt 0) { throw 'Review manifest and scanner report disagree or contain blocking findings.' }
if ($review.scanner_exit_code -ne 0 -or $review.recommendation -notin @('SAFE', 'CAUTION') -or $review.high_findings -gt 0) {
    throw 'SkillSpector result blocks installation. Review the report and choose a different candidate.'
}
$current = Get-CandidateSnapshot $review.candidate
$before = @($review.files | ConvertTo-Json -Depth 5 -Compress)
$after = @($current.files | ConvertTo-Json -Depth 5 -Compress)
if (($before -join '') -ne ($after -join '')) { throw 'Candidate changed after review. Run Review again.' }

$status = & $helper -Action Status | ConvertFrom-Json
if ($review.scope -eq 'Personal') {
    if ($status.state -ne 'ready') { throw 'Personal skill installation requires setup and Login.' }
    $login = & $helper -Action Login | ConvertFrom-Json
    $targetParent = Join-Path $coreRoot ("users/$($login.user_id)/skills")
} else {
    if ($status.state -eq 'ready') { $null = & $helper -Action Login | ConvertFrom-Json }
    $targetParent = Join-Path $coreRoot 'Feature'
}
$target = Join-Path $targetParent $review.name
if (Test-Path -LiteralPath $target) { throw "Skill already exists: $target" }
$stagingParent = Join-Path $coreRoot '.runtime/skill-staging'
New-Item -ItemType Directory -Path $stagingParent -Force | Out-Null
$staging = Join-Path $stagingParent ([guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path $staging | Out-Null
if ($current.is_directory) {
    foreach ($child in @(Get-ChildItem -LiteralPath $current.source -Force)) {
        Copy-Item -LiteralPath $child.FullName -Destination $staging -Recurse
    }
} else {
    Copy-Item -LiteralPath $current.source -Destination (Join-Path $staging 'SKILL.md')
}
$installed = Get-CandidateSnapshot $staging
$installedHashes = @($installed.files | ConvertTo-Json -Depth 5 -Compress)
if (($before -join '') -ne ($installedHashes -join '')) {
    throw "Staged copy differs from reviewed candidate. No skill was installed. Inspect $staging."
}
New-Item -ItemType Directory -Path $targetParent -Force | Out-Null
Move-Item -LiteralPath $staging -Destination $target
[pscustomobject]@{
    installed = $target
    scope = $review.scope
    review_id = $ReviewId
    recommendation = $review.recommendation
    next_step = 'Read the skill on demand and call RecordTurn after the user instruction.'
} | ConvertTo-Json
