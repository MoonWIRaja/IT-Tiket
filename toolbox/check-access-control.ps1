# Static gate for supabase/migrations/20261102120000_access_control.sql.
# This checks the migration text. It does not connect to a database.
$ErrorActionPreference = 'Stop'
$root = Split-Path -Parent $PSScriptRoot
$path = Join-Path $root 'supabase\migrations\20261102120000_access_control.sql'
if (-not (Test-Path -LiteralPath $path)) { throw "Missing $path" }
$raw = Get-Content -LiteralPath $path -Raw
$code = [regex]::Replace($raw, '(?s)/\*.*?\*/', '')
$code = [regex]::Replace($code, '(?m)--.*$', '')
$failed = @()
function Need([string]$pattern, [string]$label) {
  if ($code -notmatch $pattern) { $script:failed += $label }
}
Need 'enable row level security' 'RLS enable missing'
Need 'force row level security' 'RLS force missing'
Need 'app_actor_role' 'role helper missing'
Need 'sender_verified is server-only' 'email trust guard missing'
Need 'recording is server-only' 'recording guard missing'
Need 'karyawan can only reopen' 'reopen guard missing'
Need 'admin_set_role' 'admin role function missing'
Need 'ticket-files' 'attachment bucket missing'
Need 'revoke all on function public.app_actor_role\(\) from public' 'role helper execute not revoked'
Need 'grant update \(display_name\)' 'profile role column still writable'
$forced = [regex]::Matches($code, 'force row level security').Count
if ($forced -lt 6) { $failed += "expected at least 6 FORCE RLS, found $forced" }
if ($code -match '(?i)using\s*\(\s*true\s*\)') { $failed += 'open USING (true) policy' }
if ($code -match '(?i)grant\s+[^;]*\s+to\s+anon') { $failed += 'grant to anon' }
if ($raw -match 'service_role_key|SUPABASE_SERVICE_ROLE') { $failed += 'service key mentioned as a value' }
if ($failed.Count -gt 0) {
  $failed | ForEach-Object { Write-Output "FAIL: $_" }
  exit 1
}
Write-Output "PASS static access-control checks ($forced forced tables)"
