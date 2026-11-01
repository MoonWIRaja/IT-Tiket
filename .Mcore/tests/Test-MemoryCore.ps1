# All account data and tests live in a disposable external copy. No network required.
$ErrorActionPreference = 'Stop'
$source = Split-Path -Parent $PSScriptRoot
$testRoot = Join-Path ([IO.Path]::GetTempPath()) ('MemoryCore-tests-' + [guid]::NewGuid().ToString('N'))
$passed = [Collections.Generic.List[string]]::new()
function Assert($condition, [string]$name) {
    if (-not $condition) { throw "FAILED: $name" }
    $passed.Add($name)
}
function Reject([scriptblock]$operation, [string]$name) {
    $rejected = $false
    try { & $operation | Out-Null } catch { $rejected = $true }
    Assert $rejected $name
}
function New-Copy([string]$name) {
    $destination = Join-Path $testRoot $name
    New-Item -ItemType Directory -Path $destination -Force | Out-Null
    Copy-Item -LiteralPath $source -Destination (Join-Path $destination '.Mcore') -Recurse
    $core = Join-Path $destination '.Mcore'
    # Installer is tested separately against real tools; do not install on test fixtures.
    Set-Content -LiteralPath (Join-Path $core 'tools/Setup-Tools.ps1') -Value "'{`"ready`":true,`"rtk`":`"C:/test/rtk.exe`",`"skillspector`":`"C:/test/skillspector.exe`"}'"
    return $core
}
function gh {
    $global:LASTEXITCODE = 0
    if ($args -contains 'users/member') { return '{"id":202,"login":"member"}' }
    if ($global:McoreTestAccount -eq 'member') { return '{"id":202,"login":"member"}' }
    return '{"id":101,"login":"owner"}'
}
function Read-Host { param($Prompt, [switch]$AsSecureString) ConvertTo-SecureString $global:McoreTestPassphrase -AsPlainText -Force }
try {
    $solo = New-Copy 'solo'
    $helper = Join-Path $solo 'tools/Setup-MemoryCore.ps1'
    Assert ((& $helper -Action Status | ConvertFrom-Json).state -eq 'needs_setup') 'blank status'
    & $helper -Action Setup -Mode Solo -UserId owner -UserName Owner -AgentId kid -AgentName Kid | Out-Null
    Reject { & $helper -Action RecordTurn -Instruction before -Outcome login } 'requires login'
    $login = & $helper -Action Login | ConvertFrom-Json
    $expectedSkillCount = @(Get-ChildItem -LiteralPath (Join-Path $solo 'Feature') -Directory).Count
    Assert ($login.agent_name -eq 'Kid' -and $login.available_skills.Count -eq $expectedSkillCount) 'identity and bundled catalog'
    & $helper -Action RecordTurn -Instruction 'original request' -Outcome 'done' -EventId retry-one | Out-Null
    & $helper -Action RecordTurn -Instruction 'original request' -Outcome 'done' -EventId retry-one | Out-Null
    $login = & $helper -Action Login | ConvertFrom-Json
    Assert ($login.memory.activity.Count -eq 1) 'idempotent turn'
    Reject { & $helper -Action RecordTurn -Instruction different -Outcome done -EventId retry-one } 'event collision rejected'
    $route = & $helper -Action Route -Instruction 'semak security authentication' | ConvertFrom-Json
    Assert (@($route.selected | Where-Object { $_.skill_file -like '*Strix-Security*' }).Count -eq 1) 'security route'
    $expectedBaselineCount = @((Get-Content -LiteralPath (Join-Path $solo 'skills-routing.json') -Raw | ConvertFrom-Json).rules | Where-Object always).Count
    Assert (@($route.selected | Where-Object reason -eq baseline).Count -eq $expectedBaselineCount) 'baseline routes'
    $workflowRoute = & $helper -Action Route -Instruction 'plan an epic from requirements, architecture, stories, code review and retrospective' | ConvertFrom-Json
    Assert (@($workflowRoute.selected.name | Where-Object { $_ -in @('memorycore-workflow','bmad-method') }).Count -eq 2) 'full workflow route in English'
    $workflowRouteMs = & $helper -Action Route -Instruction 'rancang inisiatif produk, spesifikasi, seni bina, cerita, ujian dan retrospektif' | ConvertFrom-Json
    Assert (@($workflowRouteMs.selected.name | Where-Object { $_ -in @('memorycore-workflow','bmad-method') }).Count -eq 2) 'full workflow route in Malay'
    $personal = Join-Path $solo 'users/owner/skills/example'
    New-Item -ItemType Directory -Path $personal -Force | Out-Null
    Set-Content (Join-Path $personal 'SKILL.md') "---`nname: personal-example`ndescription: A personal test skill.`n---`nRead only."
    $catalog = & $helper -Action Skills | ConvertFrom-Json
    Assert (@($catalog | Where-Object scope -eq Personal).Count -eq 1) 'authenticated personal skill discovery'
    & $helper -Action AddAgent -AgentId second -AgentName Second | Out-Null
    & $helper -Action Login -AgentId second | Out-Null
    & $helper -Action RecordTurn -Instruction second -Outcome selected | Out-Null
    $second = Get-Content (Join-Path $solo 'users/owner/agents/second/memory.json') -Raw | ConvertFrom-Json
    Assert ($second.activity.Count -eq 1) 'selected agent persists for writes'
    & $helper -Action Login -AgentId kid | Out-Null
    for ($i=0; $i -lt 102; $i++) { & $helper -Action RecordTurn -Instruction "request $i" -Outcome done | Out-Null }
    $login = & $helper -Action Login | ConvertFrom-Json
    Assert ($login.memory.activity.Count -eq 100) 'bounded active memory'
    & $helper -Action Compact -Summary 'Requests completed' | Out-Null
    $login = & $helper -Action Login | ConvertFrom-Json
    Assert ($login.memory.activity.Count -eq 20) 'compaction bound'
    $originalRecall = & $helper -Action Recall -Query 'original request' | ConvertFrom-Json
    Assert (@($originalRecall.matches | Where-Object record_id -eq retry-one).Count -gt 0) 'Recall exposes stable record ID after compaction'
    & $helper -Action Forget -TargetEventId retry-one | Out-Null
    $login = & $helper -Action Login | ConvertFrom-Json
    Assert (@($login.memory.activity | Where-Object id -eq retry-one).Count -eq 0) 'Solo forget removes turn from active memory'
    $diaryAfterForget = Get-Content (Join-Path $solo 'users/owner/agents/kid/diary.json') -Raw | ConvertFrom-Json
    Assert (@($diaryAfterForget.entries | Where-Object id -eq retry-one).Count -eq 0) 'Solo forget removes turn from diary'
    $soloForgetRecall = & $helper -Action Recall -Query 'original request' | ConvertFrom-Json
    Assert (@($soloForgetRecall.matches | Where-Object record_id -eq retry-one).Count -eq 0) 'Solo forget removes record from Recall'
    Reject { & $helper -Action Forget -TargetEventId retry-one } 'Solo cannot forget same record twice'
    & $helper -Action Validate | Out-Null
    $brief = & (Join-Path $solo 'tools/Start-MemoryCore.ps1') -Provider ContextOnly | ConvertFrom-Json
    Assert ($brief.agent_name -eq 'Kid' -and (Test-Path -LiteralPath $brief.context_file)) 'provider handoff briefing'
    $readHelper = Join-Path $solo 'tools/Read-Context.ps1'
    $sample = Join-Path $testRoot 'sample.txt'
    Set-Content $sample "first`nneedle.* literal`nthird"
    $bounded = & $readHelper -Path $sample -MaxLines 1 | ConvertFrom-Json
    Assert ($bounded.clipped -and $bounded.lines.Count -eq 1) 'bounded context output'
    $literal = & $readHelper -Path $sample -Query 'needle.*' | ConvertFrom-Json
    Assert ($literal.lines.Count -eq 1 -and $literal.lines[0].line -eq 2) 'literal context search'
    $team = New-Copy 'team'
    $helper = Join-Path $team 'tools/Setup-MemoryCore.ps1'
    $global:McoreTestAccount = 'owner'; $global:McoreTestPassphrase = 'Synthetic test passphrase only 2026'
    & $helper -Action Setup -Mode Team -TeamName Test -UserId owner -UserName Owner -AgentId kid -AgentName Kid | Out-Null
    & $helper -Action UnlockVault | Out-Null
    & $helper -Action Login | Out-Null
    & $helper -Action RecordTurn -Instruction 'shared request' -Outcome 'shared result' | Out-Null
    & $helper -Action SaveMemory -Target User -Category Preferences -Text 'concise' | Out-Null
    & $helper -Action SaveTopic -TopicId topic -Text 'topic decision' | Out-Null
    & $helper -Action UpdateSession -Text 'continue here' | Out-Null
    & $helper -Action AddUser -UserId member -UserName Member -AgentId atlas -AgentName Atlas -GitHubLogin member | Out-Null
    & $helper -Action Validate | Out-Null
    $device = New-Copy 'device'
    foreach ($name in @('team.json','project-vault.json','project-events')) { Copy-Item -LiteralPath (Join-Path $team $name) -Destination $device -Recurse -Force }
    $helper2 = Join-Path $device 'tools/Setup-MemoryCore.ps1'
    $global:McoreTestPassphrase = 'Incorrect synthetic passphrase'
    Reject { & $helper2 -Action UnlockVault } 'wrong passphrase rejected'
    $global:McoreTestPassphrase = 'Synthetic test passphrase only 2026'
    & $helper2 -Action UnlockVault | Out-Null
    $restored = & $helper2 -Action Login | ConvertFrom-Json
    Assert ($restored.memory.activity.Count -eq 1 -and $restored.profile.preferences[0].text -eq 'concise' -and $restored.session.summary -eq 'continue here') 'second device restores encrypted history and profile'
    $global:McoreTestAccount = 'member'
    $member = & $helper2 -Action Login | ConvertFrom-Json
    Assert ($member.agent_name -eq 'Atlas' -and $member.memory.activity.Count -eq 0 -and $member.project_events.Count -ge 4) 'member sees shared events with own identity'
    Reject { & $helper2 -Action Forget -TargetEventId $restored.profile.preferences[0].id } 'member cannot forget another user record'
    Reject { & $helper2 -Action Login -AgentId kid } 'member cannot select owner agent'
    & $helper2 -Action Login | Out-Null
    & $helper2 -Action RecordTurn -Instruction 'member contribution' -Outcome done | Out-Null
    $global:McoreTestAccount = 'owner'
    $owner = & $helper2 -Action Login | ConvertFrom-Json
    Assert (@($owner.project_events | Where-Object author_user_id -eq member).Count -eq 1) 'shared author labels'
    $teamForgetId = [string]$owner.profile.preferences[0].id
    & $helper2 -Action Forget -TargetEventId $teamForgetId | Out-Null
    $owner = & $helper2 -Action Login | ConvertFrom-Json
    Assert ($owner.profile.preferences.Count -eq 0 -and @($owner.project_events | Where-Object id -eq $teamForgetId).Count -eq 0) 'Team forget suppresses shared cache and briefing event'
    $forgottenRecall = & $helper2 -Action Recall -Query concise | ConvertFrom-Json
    Assert (@($forgottenRecall.matches | Where-Object text -eq concise).Count -eq 0) 'Team forget suppresses Recall results'
    $eventFile = Get-ChildItem (Join-Path $device 'project-events') -File | Select-Object -First 1
    $sealed = Get-Content $eventFile.FullName -Raw | ConvertFrom-Json
    $sealed.tag = [Convert]::ToBase64String((New-Object byte[] 32))
    $sealed | ConvertTo-Json -Depth 20 | Set-Content $eventFile.FullName
    Reject { & $helper2 -Action Login } 'tampered encrypted event rejected'
    [pscustomobject]@{ passed = $passed.Count; checks = @($passed); isolation = 'Temporary copies; mocked GitHub identity and installer; real vault cryptography' } | ConvertTo-Json -Depth 5
} finally {
    Remove-Variable -Name McoreTestAccount,McoreTestPassphrase -Scope Global -ErrorAction SilentlyContinue
    if (Test-Path -LiteralPath $testRoot) {
        $resolved = (Resolve-Path -LiteralPath $testRoot).Path
        $tempBase = [IO.Path]::GetFullPath([IO.Path]::GetTempPath()).TrimEnd('\') + '\'
        if (-not $resolved.StartsWith($tempBase, [StringComparison]::OrdinalIgnoreCase) -or (Split-Path $resolved -Leaf) -notlike 'MemoryCore-tests-*') { throw 'Unsafe test cleanup path.' }
        Remove-Item -LiteralPath $resolved -Recurse -Force
    }
}

