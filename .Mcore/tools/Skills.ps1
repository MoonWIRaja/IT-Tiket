# Catalog reading needs no network or provider plugin. Personal scope must be authenticated by the caller.
function Get-McoreSkills([string]$userId = '') {
    $locations = @([pscustomobject]@{ scope = 'Team'; path = (Join-Path $coreRoot 'Feature'); relative = '.Mcore/Feature' })
    if ($userId) {
        if ($userId -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$') { throw 'Invalid skill owner ID.' }
        $locations += [pscustomobject]@{ scope = 'Personal'; path = (Join-Path $coreRoot "users/$userId/skills"); relative = ".Mcore/users/$userId/skills" }
    }
    foreach ($location in $locations) {
        if (-not (Test-Path -LiteralPath $location.path)) { continue }
        if ((Get-Item -LiteralPath $location.path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'Skill roots cannot be links.' }
        foreach ($directory in @(Get-ChildItem -LiteralPath $location.path -Directory | Sort-Object Name)) {
            if ($directory.Attributes -band [IO.FileAttributes]::ReparsePoint) { throw "Linked skill folder: $($directory.Name)" }
            $path = Join-Path $directory.FullName 'SKILL.md'
            if (-not (Test-Path -LiteralPath $path -PathType Leaf)) { continue }
            if ((Get-Item -LiteralPath $path -Force).Attributes -band [IO.FileAttributes]::ReparsePoint) { throw 'SKILL.md cannot be a link.' }
            $content = Get-Content -LiteralPath $path -Raw -Encoding UTF8
            $header = [regex]::Match($content, '(?s)\A---\r?\n(.*?)\r?\n---')
            $name = [regex]::Match($header.Groups[1].Value, '(?m)^name:\s*([^\r\n]+)').Groups[1].Value.Trim().Trim('"', "'")
            $description = [regex]::Match($header.Groups[1].Value, '(?m)^description:\s*([^\r\n]+)').Groups[1].Value.Trim().Trim('"', "'")
            if (-not $header.Success -or $name -notmatch '^[a-z0-9]+(-[a-z0-9]+)*$' -or -not $description) { throw "Invalid skill metadata: $path" }
            if ($description -match '^[>|][-+]?\s*$') {
                $description = ([regex]::Match($header.Groups[1].Value, '(?m)^description:[^\r\n]*\r?\n((?:[ \t]+[^\r\n]+\r?\n?)+)').Groups[1].Value -replace '\s+', ' ').Trim()
            }
            [pscustomobject]@{ name = $name; folder = $directory.Name; scope = $location.scope; description = $description; skill_file = "$($location.relative)/$($directory.Name)/SKILL.md" }
        }
    }
}

function Get-McoreRoute([string]$instruction, $catalog) {
    $policy = Get-Content -LiteralPath (Join-Path $coreRoot 'skills-routing.json') -Raw -Encoding UTF8 | ConvertFrom-Json
    $baseline = @()
    $named = @()
    $taskMatches = @()
    foreach ($skill in $catalog) {
        $rule = @($policy.rules | Where-Object { $_.folder -eq $skill.folder -and $skill.scope -eq 'Team' })
        $item = $null
        if ($rule.Count -gt 0 -and $rule[0].always) {
            $item = [pscustomobject]@{ name = $skill.name; scope = $skill.scope; reason = 'baseline'; score = 10000; matched_terms = @(); skill_file = $skill.skill_file }
            $baseline += $item
            continue
        }
        if ($instruction -match [regex]::Escape($skill.name) -or $instruction -match [regex]::Escape($skill.folder)) {
            $item = [pscustomobject]@{ name = $skill.name; scope = $skill.scope; reason = 'named skill'; score = 20000; matched_terms = @($skill.name); skill_file = $skill.skill_file }
            $named += $item
            continue
        }
        if ($rule.Count -gt 0 -and $rule[0].pattern) {
            $regexHits = @([regex]::Matches($instruction, $rule[0].pattern) | ForEach-Object { $_.Value.ToLowerInvariant() } | Select-Object -Unique)
            if ($regexHits.Count -gt 0) {
                $item = [pscustomobject]@{ name = $skill.name; scope = $skill.scope; reason = 'task match'; score = 1000 + $regexHits.Count; matched_terms = $regexHits; skill_file = $skill.skill_file }
                $taskMatches += $item
            }
        }
    }
    $limit = 5
    if ($null -ne $policy.max_task_suggestions) { $limit = [Math]::Max(0, [int]$policy.max_task_suggestions) }
    $rankedTaskMatches = @($taskMatches | Sort-Object @{ Expression = 'score'; Descending = $true }, @{ Expression = 'name'; Descending = $false } | Select-Object -First $limit)
    $selected = @($baseline) + @($named | Sort-Object name) + $rankedTaskMatches
    [pscustomobject]@{
        selected = $selected
        selection_mode = "Ranked keyword suggestions (up to $limit task matches) plus AI semantic selection from the full catalog; suggestions are not an access gate."
        next_action = 'Read relevant selected SKILL.md files; choose additional catalog skills by task meaning. Reuse installed capabilities before recommending an addition. Ask Team or Personal only when adding a new skill.'
    }
}
