# Sambung (link) projek Supabase cloud + db push + lint, tanpa Docker.
# Rahsia: SUPABASE_ACCESS_TOKEN daripada env sahaja. Direct connection Postgres
# dibenarkan (keputusan MoonWiRaja, 2026-11-02): bila SUPABASE_DB_PASSWORD atau
# SUPABASE_DB_URL ada (env, atau dalam root .env.local), CLI memakainya secara
# automatik - kata-laluan hanya melalui stdin; URL tidak dicetak.
# Awak laksanakan skrip ini dalam terminal sendiri:
#    $env:SUPABASE_ACCESS_TOKEN = "<token dari https://supabase.com/dashboard/account/tokens>"
#    powershell toolbox/link-supabase.ps1 -ProjectRef abcdefghijklmnopqrst [-DryRun] [-SetCiSecrets]
# ASCII sahaja: Windows PowerShell 5.1 membaca .ps1 tanpa BOM sebagai ANSI.
[CmdletBinding()]
param(
    [string]$ProjectRef = $env:SUPABASE_PROJECT_REF,
    [switch]$DryRun,
    [switch]$SkipLint,
    [switch]$SetCiSecrets,
    [string]$Repo = 'MoonWIRaja/IT-Tiket'
)
$ErrorActionPreference = 'Stop'

function Read-DotEnv([string]$path) {
    if (-not (Test-Path $path)) { return @{} }
    $vars = @{}
    foreach ($line in Get-Content $path) {
        $t = $line.Trim()
        if (-not $t -or $t.StartsWith('#')) { continue }
        $i = $t.IndexOf('=')
        if ($i -lt 1) { continue }
        $vars[$t.Substring(0, $i).Trim()] = $t.Substring($i + 1).Trim().Trim('"')
    }
    return $vars
}

# PS 5.1: $PSScriptRoot boleh kosong bila jalan melalui -File; guna fallback.
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot -and $MyInvocation.MyCommand.Path) { $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $scriptRoot) { $scriptRoot = Get-Location }
$localEnv = Read-DotEnv (Join-Path $scriptRoot '..\.env.local')

$dbPassword = $env:SUPABASE_DB_PASSWORD
if (-not $dbPassword) { $dbPassword = $localEnv['SUPABASE_DB_PASSWORD'] }
if ($dbPassword) { $dbPassword = $dbPassword.Trim() }
$dbUrl = $env:SUPABASE_DB_URL
if (-not $dbUrl) { $dbUrl = $localEnv['SUPABASE_DB_URL'] }
if ($dbUrl) { $dbUrl = $dbUrl.Trim() }

if (-not $env:SUPABASE_ACCESS_TOKEN) {
    throw "SUPABASE_ACCESS_TOKEN tiada dalam env. Set dalam terminal awak dulu (jangan tampal token dalam chat): `$env:SUPABASE_ACCESS_TOKEN = '<token disini>'."
}
if (-not $ProjectRef) {
    throw "ProjectRef tiada. Hantar -ProjectRef <20-huruf ref dari URL projek> atau set `$env:SUPABASE_PROJECT_REF."
}
$ProjectRef = $ProjectRef.Trim()
if ($ProjectRef -notmatch '^[a-z0-9]{20}$') {
    Write-Warning "ProjectRef tidak seperti bentuk lazim ([a-z0-9]{20}). Teruskan kalau betul."
}

if ($dbUrl) {
    Write-Host "Direct connection: AKTIF guna SUPABASE_DB_URL (host dirahsiakan)."
} elseif ($dbPassword) {
    Write-Host "Direct connection: AKTIF guna kata-laluan DB (via stdin bila CLI minta)."
} else {
    Write-Host "Direct connection: belum disetel - ops jalan ikut access token; lepas soalan kata-laluan dengan Enter kosong."
}

Write-Host "== 1/4 supabase link --project-ref $ProjectRef =="
if ($dbPassword) {
    # Kata-laluan DB melintas stdin sahaja (tidak dalam argv/stdout).
    $dbPassword | supabase link --project-ref $ProjectRef
} else {
    supabase link --project-ref $ProjectRef
}
if ($LASTEXITCODE -ne 0) { throw "supabase link gagal (exit $LASTEXITCODE)." }

Write-Host "== 2/4 supabase db push $(if ($DryRun) { '(dry-run)' }) =="
if ($DryRun) { supabase db push --dry-run } else { supabase db push }
if ($LASTEXITCODE -ne 0 -and $dbUrl) {
    Write-Host "cuba semula secara direct (--db-url)..."
    if ($DryRun) { supabase db push --dry-run --db-url $dbUrl } else { supabase db push --db-url $dbUrl }
}
if ($LASTEXITCODE -ne 0) { throw "supabase db push gagal (exit $LASTEXITCODE)." }

if (-not $SkipLint) {
    Write-Host "== 3/4 supabase db lint --project-ref $ProjectRef =="
    supabase db lint --project-ref $ProjectRef --fail-on error
    if ($LASTEXITCODE -ne 0 -and $dbUrl) {
        Write-Host "cuba semula secara direct (--db-url)..."
        supabase db lint --db-url $dbUrl --fail-on error
    } elseif ($LASTEXITCODE -ne 0 -and $dbPassword) {
        Write-Host "cuba semula secara direct (kata-laluan via stdin)..."
        $dbPassword | supabase db lint --project-ref $ProjectRef --fail-on error
    }
    if ($LASTEXITCODE -ne 0) {
        Write-Warning "db lint lapor masih ada isu (exit $LASTEXITCODE). Migrasi tetap terpakai - semak senarai di atas."
    }
}

if ($SetCiSecrets) {
    Write-Host "== 4/4 gh secret set ($Repo) =="
    gh secret set SUPABASE_PROJECT_REF --repo $Repo --body $ProjectRef
    if ($LASTEXITCODE -ne 0) { throw "gh gagal set SUPABASE_PROJECT_REF (perlu 'gh auth login' sekali?)." }
    # Token melintas stdin sahaja; tidak keluar dalam argv atau stdout.
    $env:SUPABASE_ACCESS_TOKEN | gh secret set SUPABASE_ACCESS_TOKEN --repo $Repo
    if ($LASTEXITCODE -ne 0) { throw "gh gagal set SUPABASE_ACCESS_TOKEN." }
    Write-Host "Rahsia repo disetel. Push satu commit supaya backend-ci jalankan db push dry-run dengan rahsia baharu."
} else {
    Write-Host "== 4/4 dilangkau (-SetCiSecrets tidak diberikan). =="
}

Write-Host "== SIAP. Studio web: https://supabase.com/dashboard/project/$ProjectRef =="
Write-Host "Baki pilihan awak: isi .env.local DI ROOT (URL + anon key (+ service_role; pilihan direct connection: SUPABASE_DB_PASSWORD / SUPABASE_DB_URL)) lalu powershell toolbox/check-supabase-config.ps1. web/.env.local diselaras automatik oleh predev/prebuild."
