# Sambung (link) projek Supabase cloud + db push + lint, tanpa Docker.
# Rahsia: SUPABASE_ACCESS_TOKEN hanya dari env. Tiada token dicetak, dihantar
# sebagai parameter, atau ditulis ke fail. Awak laksanakan skrip ini dalam
# terminal sendiri:
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

Write-Host "== 1/4 supabase link --project-ref $ProjectRef =="
# Catatan: CLI kadang bertanya kata-laluan DB di sini; tekan Enter kosong untuk
# melepaskan soalan itu, sebab db push ikut API pengurusan - cukup access token sahaja.
supabase link --project-ref $ProjectRef
if ($LASTEXITCODE -ne 0) { throw "supabase link gagal (exit $LASTEXITCODE)." }

Write-Host "== 2/4 supabase db push $(if ($DryRun) { '(dry-run)' }) =="
if ($DryRun) { supabase db push --dry-run } else { supabase db push }
if ($LASTEXITCODE -ne 0) { throw "supabase db push gagal (exit $LASTEXITCODE)." }

if (-not $SkipLint) {
    Write-Host "== 3/4 supabase db lint --linked (proj: $ProjectRef) =="
    supabase db lint --linked --fail-on error
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
Write-Host "Baki pilihan awak: isi .env.local DI ROOT (URL + anon key (+ service_role)) lalu powershell toolbox/check-supabase-config.ps1. web/.env.local diselaras automatik oleh predev/prebuild."
