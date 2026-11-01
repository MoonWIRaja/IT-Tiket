param([switch]$CheckOnly)
$ErrorActionPreference = 'Stop'
. (Join-Path $PSScriptRoot 'Tools.ps1')
$manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'dependencies.json') -Raw | ConvertFrom-Json

function Install-PinnedBinary([string]$name) {
    if ($env:OS -ne 'Windows_NT' -or -not [Environment]::Is64BitOperatingSystem -or ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64' -and $env:PROCESSOR_ARCHITEW6432 -ne 'AMD64')) { throw 'Automatic binary setup supports Windows x64. Install the tools on this platform before continuing.' }
    $spec = $manifest.$name
    $destination = Join-Path $env:LOCALAPPDATA "MemoryCore/tools/$name-$($spec.version)"
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    $archive = Join-Path $destination 'download.zip'
    Invoke-WebRequest -Uri $spec.url -OutFile $archive -UseBasicParsing
    if ((Get-FileHash -LiteralPath $archive -Algorithm SHA256).Hash.ToLowerInvariant() -cne $spec.sha256) { throw "Checksum mismatch for $name. No binary was installed." }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    $zip = [IO.Compression.ZipFile]::OpenRead($archive)
    try {
        $entries = @($zip.Entries | Where-Object { $_.Name -ceq $spec.binary })
        if ($entries.Count -ne 1) { throw "Expected exactly one $($spec.binary) in archive." }
        $binary = Join-Path $destination $spec.binary
        [IO.Compression.ZipFileExtensions]::ExtractToFile($entries[0], $binary, $true)
    } finally { $zip.Dispose() }
    return $binary
}

$rtk = Resolve-McoreTool 'rtk'
$scanner = Resolve-McoreTool 'skillspector'
if (-not $CheckOnly) {
    if (-not $rtk) { $rtk = Install-PinnedBinary 'rtk' }
    if (-not $scanner) {
        $uv = Resolve-McoreTool 'uv'
        if (-not $uv) { $uv = Install-PinnedBinary 'uv' }
        & $uv tool install --python 3.12 $manifest.skillspector.url | Out-Host
        if ($LASTEXITCODE -ne 0) { throw 'SkillSpector installation failed; retry setup after resolving the installer error.' }
        $scanner = Resolve-McoreTool 'skillspector'
        if (-not $scanner) { throw 'SkillSpector installed but its executable was not found. Check uv tool dir --bin.' }
    }
    $version = (& $rtk --version) -join ' '
    if ($LASTEXITCODE -ne 0 -or $version -notmatch '^rtk\s+\d') { throw 'RTK executable is not usable.' }
    & $rtk gain --help | Out-Null
    if ($LASTEXITCODE -ne 0) { throw 'Wrong RTK package: token savings CLI is required.' }
    $scannerVersion = (& $scanner --version) -join ' '
    if ($LASTEXITCODE -ne 0 -or $scannerVersion -notmatch 'SkillSpector') { throw 'SkillSpector executable is not usable.' }
}
[pscustomobject]@{
    ready = [bool]($rtk -and $scanner)
    rtk = $rtk; skillspector = $scanner
    ponytail = 'bundled native skill'; caveman = 'bundled native skill'
    security = 'bundled AI review; no Strix API key or separate login'
} | ConvertTo-Json
