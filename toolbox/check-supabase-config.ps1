# Semak sambungan Supabase projek cloud untuk IT-Tiket (tiada Docker).
# Tidak mencetak sebarang nilai kunci - status sahaja. Exit 1 = ada yang gagal.
# ASCII sahaja: Windows PowerShell 5.1 membaca .ps1 tanpa BOM sebagai ANSI.
[CmdletBinding()]
param(
    [string]$EnvFile
)
$ErrorActionPreference = 'Stop'
$fail = 0

# PS 5.1: $PSScriptRoot boleh kosong bila jalan melalui -File; guna fallback.
$scriptRoot = $PSScriptRoot
if (-not $scriptRoot -and $MyInvocation.MyCommand.Path) { $scriptRoot = Split-Path -Parent $MyInvocation.MyCommand.Path }
if (-not $scriptRoot) { $scriptRoot = Get-Location }
if (-not $EnvFile) {
    $envRoot = Join-Path $scriptRoot '..\.env.local'
    $envWeb  = Join-Path $scriptRoot '..\web\.env.local'
    if (Test-Path $envRoot) { $EnvFile = $envRoot }
    elseif (Test-Path $envWeb) {
        $EnvFile = $envWeb
        Write-Host "PESAN: root .env.local tiada; nilaian dibaca dari web/.env.local sementara. Fail rasmi: .env.local di root." -ForegroundColor Yellow
    } else { $EnvFile = $envRoot }
}

function Read-DotEnv([string]$path) {
    if (-not (Test-Path $path)) { return $null }
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

Write-Host "== Semak $EnvFile =="
$e = Read-DotEnv $EnvFile
if ($null -eq $e) {
    Write-Host "FAIL: fail tiada. Salin .env.example (root) ke .env.local (root), isi nilai, jalan semula." -ForegroundColor Red
    exit 1
}

$url = $e['NEXT_PUBLIC_SUPABASE_URL']
$ref = $null
if (-not $url) {
    Write-Host "FAIL: NEXT_PUBLIC_SUPABASE_URL kosong. Tampal Project URL dari settings/api ke .env.local (root)." -ForegroundColor Red
    $fail++
} elseif ($url -match '^https://(?<r>[a-z0-9]{20})\.supabase\.co/?$') {
    $ref = $Matches['r']
    Write-Host "PASS: Project URL bentuk betul (ref: $ref)."
} elseif ($url -match '^https://[a-z0-9]+\.supabase\.co/?$') {
    Write-Host "PESAN: host supabase.co betul, tapi ref tidak seperti bentuk lazim (20 huruf/nombor). Pastikan ini URL projek yang betul." -ForegroundColor Yellow
} else {
    Write-Host "FAIL: bukan bentuk https://<ref>.supabase.co. Semak semula dari settings/api." -ForegroundColor Red
    $fail++
}

$anon = $e['NEXT_PUBLIC_SUPABASE_ANON_KEY']
if (-not $anon) {
    Write-Host "FAIL: NEXT_PUBLIC_SUPABASE_ANON_KEY kosong. Tampal key 'anon public'." -ForegroundColor Red
    $fail++
} elseif ($anon.StartsWith('eyJ') -or $anon.StartsWith('sb_publishable_')) {
    Write-Host "PASS: anon key bentuk betul (key ini memang untuk klien, boleh awam)."
} else {
    Write-Host "FAIL: anon key tidak dikenali (perlu JWT 'eyJ...' atau 'sb_publishable_...')." -ForegroundColor Red
    $fail++
}

$srv = $e['SUPABASE_SERVICE_ROLE_KEY']
if (-not $srv) {
    Write-Host "PESAN: SUPABASE_SERVICE_ROLE_KEY kosong - boleh diisi kemudian; perlu untuk skrin admin (urus pengguna). Hanya di server; jangan sekali-kali dengan prefix NEXT_PUBLIC_."
} else {
    Write-Host "PASS: service_role key ada (server sahaja)."
}

$ice = $e['NEXT_PUBLIC_ICE_SERVERS']
if ($ice) {
    Write-Host "PESAN: NEXT_PUBLIC_ICE_SERVERS disetel (pastikan JSON sah, bermula '[')."
} else {
    Write-Host "PESAN: NEXT_PUBLIC_ICE_SERVERS kosong = STUN awam sahaja; panggilan produksi perlukan TURN nanti."
}

# Direct connection Postgres (bila awak setel): untuk CLI/toolbox sahaja.
$dbUrl = $e['SUPABASE_DB_URL']
if (-not $dbUrl -and $env:SUPABASE_DB_URL) { $dbUrl = $env:SUPABASE_DB_URL }
if ($dbUrl -and $dbUrl.Trim()) {
    if ($dbUrl.Trim() -match '^postgres(ql)?://[^\s]+$' -and $dbUrl -match 'supabase\.(co|com)') {
        Write-Host "PASS: SUPABASE_DB_URL disetel - direct connection aktif untuk CLI (lint/push)."
    } else {
        Write-Host "AMARAN: SUPABASE_DB_URL tidak seperti URL Postgres Supabase (postgresql://...pooler.supabase.com:5432/postgres)." -ForegroundColor Yellow
    }
} elseif ($e['SUPABASE_DB_PASSWORD'] -or $env:SUPABASE_DB_PASSWORD) {
    Write-Host "PASS: SUPABASE_DB_PASSWORD disetel - CLI boleh jawab soalan kata-laluan secara automatik."
} else {
    Write-Host "PESAN: direct connection belum disetel (SUPABASE_DB_PASSWORD / SUPABASE_DB_URL kosong) - cukup access token untuk link + db push; lint penuh perlu kelayakan DB nanti."
}

if ($ref) {
    $linkFile = Join-Path $PSScriptRoot '..\supabase\.temp\project-id'
    if (Test-Path $linkFile) {
        $linked = (Get-Content $linkFile -Raw).Trim()
        if ($linked -and $linked -ne $ref) {
            Write-Host "AMARAN: 'supabase link' tempatan masih menunjuk ke ref lain. Jalankan semula toolbox/link-supabase.ps1." -ForegroundColor Yellow
        }
    }
    if ($env:SUPABASE_PROJECT_REF -and $env:SUPABASE_PROJECT_REF.Trim() -ne $ref) {
        Write-Host "AMARAN: SUPABASE_PROJECT_REF dalam env berbeza dengan URL projek." -ForegroundColor Yellow
    }
}

if ($fail -gt 0) {
    Write-Host "== $fail item GAGAL. Isi .env.local (ROOT) dengan betul dahulu. ==" -ForegroundColor Red
    exit 1
}
Write-Host "== SEMUA NILAI ASAS PASS. ==" -ForegroundColor Green
Write-Host "Baki pilihan awak:"
Write-Host "1. powershell toolbox/link-supabase.ps1 -ProjectRef <ref>   (terminal awak; perlukan `$env:SUPABASE_ACCESS_TOKEN supaya db push maju tanpa Docker)"
Write-Host "2. laksanakan sekali dengan -SetCiSecrets untuk isi rahsia repo CI (gh perlu login)"
Write-Host "3. push commit supaya backend-ci jalankan db push dry-run dengan rahsia baharu"
