# Shared project events are encrypted before they enter Git. This file is dot-sourced
# by Setup-MemoryCore.ps1 after $coreRoot and $utf8 have been initialized.
Add-Type -AssemblyName System.Security
$vaultPath = Join-Path $coreRoot 'project-vault.json'
$keyCachePath = Join-Path $coreRoot '.vault-key.dpapi'
$eventsRoot = Join-Path $coreRoot 'project-events'

function New-RandomBytes([int]$length) {
    $bytes = New-Object byte[] $length
    $rng = [System.Security.Cryptography.RandomNumberGenerator]::Create()
    try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
    return ,$bytes
}

function Derive-VaultKey([string]$passphrase, [byte[]]$salt, [int]$iterations = 200000) {
    if ($iterations -lt 200000 -or $iterations -gt 2000000) {
        throw 'Project vault KDF iteration count is outside the supported range.'
    }
    $kdf = [System.Security.Cryptography.Rfc2898DeriveBytes]::new(
        $passphrase, $salt, $iterations, [System.Security.Cryptography.HashAlgorithmName]::SHA256)
    try { return ,($kdf.GetBytes(64)) } finally { $kdf.Dispose() }
}

function Protect-VaultBytes([byte[]]$plain, [byte[]]$key) {
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $key[0..31]
    $aes.GenerateIV()
    try {
        $encryptor = $aes.CreateEncryptor()
        try { $cipher = $encryptor.TransformFinalBlock($plain, 0, $plain.Length) }
        finally { $encryptor.Dispose() }
        $signed = New-Object byte[] ($aes.IV.Length + $cipher.Length)
        [Array]::Copy($aes.IV, 0, $signed, 0, $aes.IV.Length)
        [Array]::Copy($cipher, 0, $signed, $aes.IV.Length, $cipher.Length)
        $hmac = [System.Security.Cryptography.HMACSHA256]::new([byte[]]$key[32..63])
        try { $tag = $hmac.ComputeHash($signed) } finally { $hmac.Dispose() }
        return [pscustomobject]@{
            version = 1
            iv = [Convert]::ToBase64String($aes.IV)
            ciphertext = [Convert]::ToBase64String($cipher)
            tag = [Convert]::ToBase64String($tag)
        }
    } finally { $aes.Dispose() }
}

function Unprotect-VaultBytes($sealed, [byte[]]$key) {
    if ($sealed.version -ne 1) { throw 'Unsupported project vault event version.' }
    $iv = [Convert]::FromBase64String($sealed.iv)
    $cipher = [Convert]::FromBase64String($sealed.ciphertext)
    $tag = [Convert]::FromBase64String($sealed.tag)
    if ($iv.Length -ne 16 -or $tag.Length -ne 32) { throw 'Invalid project vault event.' }
    $signed = New-Object byte[] ($iv.Length + $cipher.Length)
    [Array]::Copy($iv, 0, $signed, 0, $iv.Length)
    [Array]::Copy($cipher, 0, $signed, $iv.Length, $cipher.Length)
    $hmac = [System.Security.Cryptography.HMACSHA256]::new([byte[]]$key[32..63])
    try { $expected = $hmac.ComputeHash($signed) } finally { $hmac.Dispose() }
    $difference = 0
    for ($i = 0; $i -lt 32; $i++) { $difference = $difference -bor ($tag[$i] -bxor $expected[$i]) }
    if ($difference -ne 0) { throw 'Project vault authentication failed. Wrong passphrase or modified data.' }
    $aes = [System.Security.Cryptography.Aes]::Create()
    $aes.Mode = [System.Security.Cryptography.CipherMode]::CBC
    $aes.Padding = [System.Security.Cryptography.PaddingMode]::PKCS7
    $aes.Key = $key[0..31]
    $aes.IV = $iv
    try {
        $decryptor = $aes.CreateDecryptor()
        try { return ,($decryptor.TransformFinalBlock($cipher, 0, $cipher.Length)) }
        finally { $decryptor.Dispose() }
    } finally { $aes.Dispose() }
}

function Get-VaultKey {
    if (-not (Test-Path -LiteralPath $vaultPath)) { throw 'Project vault is not initialized. Run UnlockVault on the owner device.' }
    if (-not (Test-Path -LiteralPath $keyCachePath)) { throw 'Project vault is locked. Run UnlockVault locally.' }
    $protected = [System.IO.File]::ReadAllBytes($keyCachePath)
    $key = [System.Security.Cryptography.ProtectedData]::Unprotect(
        $protected, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    $vault = Read-Json $vaultPath
    $verified = [Text.Encoding]::UTF8.GetString((Unprotect-VaultBytes $vault.verifier $key))
    if ($verified -ne 'MemoryCore project vault v1') { throw 'Project vault key does not match this repository.' }
    return ,$key
}

function Unlock-ProjectVault {
    $secure = Read-Host 'Project vault passphrase (entered locally; do not paste into AI chat)' -AsSecureString
    $ptr = [Runtime.InteropServices.Marshal]::SecureStringToBSTR($secure)
    try { $passphrase = [Runtime.InteropServices.Marshal]::PtrToStringBSTR($ptr) }
    finally { [Runtime.InteropServices.Marshal]::ZeroFreeBSTR($ptr) }
    if ([string]::IsNullOrWhiteSpace($passphrase) -or $passphrase.Length -lt 16) {
        throw 'Project vault passphrase must contain at least 16 characters.'
    }
    if (Test-Path -LiteralPath $vaultPath) {
        $vault = Read-Json $vaultPath
        if ($vault.version -ne 1) { throw 'Unsupported project vault version.' }
        if ($vault.kdf -ne 'PBKDF2-HMAC-SHA256') { throw 'Unsupported project vault key-derivation function.' }
        $salt = [Convert]::FromBase64String($vault.salt)
        $key = Derive-VaultKey $passphrase $salt ([int]$vault.iterations)
        $verified = [Text.Encoding]::UTF8.GetString((Unprotect-VaultBytes $vault.verifier $key))
        if ($verified -ne 'MemoryCore project vault v1') { throw 'Wrong project vault passphrase.' }
    } else {
        $salt = New-RandomBytes 16
        $key = Derive-VaultKey $passphrase $salt
        $vault = [pscustomobject]@{
            version = 1
            kdf = 'PBKDF2-HMAC-SHA256'
            iterations = 200000
            salt = [Convert]::ToBase64String($salt)
            verifier = Protect-VaultBytes ([Text.Encoding]::UTF8.GetBytes('MemoryCore project vault v1')) $key
        }
        Write-Json $vaultPath $vault
    }
    $protected = [System.Security.Cryptography.ProtectedData]::Protect(
        $key, $null, [System.Security.Cryptography.DataProtectionScope]::CurrentUser)
    [System.IO.File]::WriteAllBytes($keyCachePath, $protected)
    Write-Output 'Project vault unlocked for this Windows account.'
}

function Write-ProjectEvent($event) {
    if ($event.id -notmatch '^[A-Za-z0-9-]{1,128}$') { throw 'Invalid project event ID.' }
    $key = Get-VaultKey
    if (-not (Test-Path -LiteralPath $eventsRoot)) { New-Item -ItemType Directory -Path $eventsRoot -Force | Out-Null }
    $path = Join-Path $eventsRoot ($event.id + '.json')
    if (Test-Path -LiteralPath $path) {
        $old = [Text.Encoding]::UTF8.GetString((Unprotect-VaultBytes (Read-Json $path) $key)) | ConvertFrom-Json
        if ($old.author_user_id -ne $event.author_user_id -or $old.agent_id -ne $event.agent_id -or $old.kind -ne $event.kind -or
            $old.data.instruction -cne $event.data.instruction -or $old.data.outcome -cne $event.data.outcome -or $old.data.status -ne $event.data.status -or
            $old.data.text -cne $event.data.text -or $old.data.target -ne $event.data.target -or $old.data.category -ne $event.data.category -or $old.data.topic_id -ne $event.data.topic_id) {
            throw 'Project event ID collision: existing event has different content or author.'
        }
        return
    }
    $plain = [Text.Encoding]::UTF8.GetBytes(($event | ConvertTo-Json -Depth 30 -Compress))
    Write-Json $path (Protect-VaultBytes $plain $key)
}

function Read-ProjectEvents([int]$last = 0) {
    $key = Get-VaultKey
    if (-not (Test-Path -LiteralPath $eventsRoot)) { return @() }
    $files = @(Get-ChildItem -LiteralPath $eventsRoot -Filter '*.json' -File | Sort-Object Name)
    if ($last -gt 0) { $files = @($files | Select-Object -Last $last) }
    $events = @()
    foreach ($file in $files) {
        $plain = Unprotect-VaultBytes (Read-Json $file.FullName) $key
        $event = [Text.Encoding]::UTF8.GetString($plain) | ConvertFrom-Json
        if ($event.id -cne $file.BaseName -or $event.id -notmatch '^[A-Za-z0-9-]{1,128}$') { throw 'Project event filename and ID differ.' }
        $events += @($event)
    }
    return @($events | Sort-Object @{Expression = { [DateTimeOffset]$_.at }}, id)
}
