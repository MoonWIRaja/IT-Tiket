# Return tombstoned event IDs as author|event-id keys. A tombstone is accepted
# only when it was written by the same author as the original supported record.
function Get-ForgottenEventIds($events, [string]$userId = '') {
    $eventsById = @{}
    foreach ($event in @($events)) {
        if ($event.kind -ne 'forget' -and -not [string]::IsNullOrWhiteSpace([string]$event.id)) {
            $eventsById[[string]$event.id] = $event
        }
    }
    $forgotten = @{}
    foreach ($event in @($events | Where-Object { $_.kind -eq 'forget' })) {
        if (-not [string]::IsNullOrWhiteSpace($userId) -and $event.author_user_id -ne $userId) { continue }
        $targetId = [string]$event.data.target_event_id
        if ([string]::IsNullOrWhiteSpace($targetId) -or -not $eventsById.ContainsKey($targetId)) { continue }
        $target = $eventsById[$targetId]
        if ($target.author_user_id -ne $event.author_user_id -or $target.agent_id -ne $event.agent_id -or
            $target.kind -notin @('turn','diary','memory','topic')) { continue }
        $forgotten[([string]$target.author_user_id + '|' + $targetId)] = $true
    }
    return $forgotten
}

function Test-EventForgotten($forgotten, [string]$authorUserId, [string]$eventId) {
    if ([string]::IsNullOrWhiteSpace($eventId)) { return $false }
    return $forgotten.ContainsKey($authorUserId + '|' + $eventId)
}

# Rebuild the authenticated member's derived cache from the shared event log.
function Restore-McoreCache($user, $agent, $events) {
    $profile = [pscustomobject]@{ facts = @(); preferences = @(); goals = @() }
    $memory = [pscustomobject]@{ summary = ''; facts = @(); preferences = @(); decisions = @(); questions = @(); activity = @() }
    $diary = [pscustomobject]@{ entries = @() }
    $topics = [pscustomobject]@{ topics = @() }
    $session = [pscustomobject]@{ summary = ''; updated_at = $null }
    $compaction = [pscustomobject]@{ policy = 'Preserve meaning and uncertainty.'; snapshot = $null; last_compacted_at = $null }
    $forgotten = Get-ForgottenEventIds $events $user.id
    foreach ($event in @($events | Sort-Object @{Expression = { [DateTimeOffset]$_.at }}, id)) {
        if ($event.author_user_id -ne $user.id) { continue }
        if ($event.kind -eq 'forget' -or (Test-EventForgotten $forgotten $event.author_user_id $event.id)) { continue }
        $note = [pscustomobject]@{ id = $event.id; at = $event.at; text = $event.data.text }
        if ($event.kind -eq 'memory' -and $event.data.target -eq 'User') {
            $key = ([string]$event.data.category).ToLowerInvariant()
            if ($key -notin @('facts','preferences','goals')) { throw 'Invalid user memory category in project log.' }
            $profile.$key = @($profile.$key) + @($note)
        }
        if ($event.agent_id -ne $agent.id) { continue }
        switch ($event.kind) {
            'turn' {
                $memory.activity = @($memory.activity) + @($event.data)
                $diary.entries = @($diary.entries) + @($event.data)
            }
            'diary' { $diary.entries = @($diary.entries) + @($note) }
            'memory' {
                if ($event.data.target -eq 'Agent') {
                    $key = ([string]$event.data.category).ToLowerInvariant()
                    if ($key -notin @('facts','preferences','decisions','questions')) { throw 'Invalid agent memory category in project log.' }
                    $memory.$key = @($memory.$key) + @($note)
                }
            }
            'session' { $session.summary = $event.data.text; $session.updated_at = $event.at }
            'topic' {
                $topic = @($topics.topics | Where-Object { $_.id -eq $event.data.topic_id })
                if ($topic.Count -eq 0) {
                    $topics.topics += [pscustomobject]@{ id = $event.data.topic_id; entries = @($note) }
                } else { $topic[0].entries = @($topic[0].entries) + @($note) }
            }
            'compaction' {
                $compaction.snapshot = $memory | ConvertTo-Json -Depth 30 | ConvertFrom-Json
                $compaction.last_compacted_at = $event.at
                $memory.summary = $event.data.text
                foreach ($key in @('facts','preferences','decisions','questions')) { $memory.$key = @() }
                $memory.activity = @($memory.activity | Select-Object -Last 20)
            }
        }
    }
    $memory.activity = @($memory.activity | Select-Object -Last 100)
    $root = Get-AgentRoot $user.id $agent.id
    Write-Json (Join-Path (Get-UserRoot $user.id) 'profile.json') $profile
    foreach ($item in @(
        @{ name = 'memory'; value = $memory }, @{ name = 'diary'; value = $diary },
        @{ name = 'topics'; value = $topics }, @{ name = 'session'; value = $session },
        @{ name = 'compaction'; value = $compaction }
    )) { Write-Json (Join-Path $root ($item.name + '.json')) $item.value }
}
