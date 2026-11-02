# Apply the branded OTP signup email + 5 min / 6 digit code to the linked Supabase project.
# Needs SUPABASE_ACCESS_TOKEN (env) and project ref from SUPABASE_PROJECT_REF or supabase/.temp/project-ref.
$ErrorActionPreference = 'Stop'
$root = Split-Path $PSScriptRoot -Parent
$ref = if ($env:SUPABASE_PROJECT_REF) { $env:SUPABASE_PROJECT_REF } else { (Get-Content (Join-Path $root 'supabase/.temp/project-ref') -Raw).Trim() }
$html = Get-Content (Join-Path $root 'supabase/templates/confirmation.html') -Raw -Encoding UTF8
$body = @{
  mailer_subjects_confirmation = 'Your IT-Tiket verification code'
  mailer_templates_confirmation_content = $html
  mailer_autoconfirm = $false
  mailer_otp_exp = 300
  mailer_otp_length = 6
} | ConvertTo-Json
Invoke-RestMethod -Method Patch -Uri "https://api.supabase.com/v1/projects/$ref/config/auth" `
  -Headers @{ Authorization = "Bearer $env:SUPABASE_ACCESS_TOKEN" } -ContentType 'application/json; charset=utf-8' -Body $body | Out-Null
Write-Host 'auth email template + 5 min OTP applied'
