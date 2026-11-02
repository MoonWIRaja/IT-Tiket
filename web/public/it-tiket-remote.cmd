@echo off
title IT-Tiket Remote Helper - close this window to stop remote control
powershell -NoProfile -ExecutionPolicy Bypass -Command "$s=(Get-Content -Raw -LiteralPath '%~f0') -split '#PS1#',3; Invoke-Expression $s[2]"
exit /b
#PS1#
# Runs only while this window is open. Installs nothing and does not start with Windows.
$port = 47615
$origins = 'https://moonwiraja.github.io', 'http://localhost:3000'
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public static class Input {
  [StructLayout(LayoutKind.Sequential)] struct MOUSE { public int dx, dy, data; public uint flags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Sequential)] struct KEY { public ushort vk, scan; public uint flags, time; public IntPtr extra; }
  [StructLayout(LayoutKind.Explicit)] struct U { [FieldOffset(0)] public MOUSE m; [FieldOffset(0)] public KEY k; }
  [StructLayout(LayoutKind.Sequential)] struct INPUT { public uint type; public U u; }
  [DllImport("user32.dll")] static extern uint SendInput(uint n, INPUT[] i, int size);
  static void Send(INPUT i) { SendInput(1, new[] { i }, Marshal.SizeOf(typeof(INPUT))); }
  public static void Mouse(double x, double y, uint flags, int data) {
    var i = new INPUT { type = 0 };
    i.u.m = new MOUSE { dx = (int)(x * 65535), dy = (int)(y * 65535), data = data, flags = flags | 0x8001 };
    Send(i);
  }
  public static void Key(ushort vk, bool up) {
    var i = new INPUT { type = 1 };
    i.u.k = new KEY { vk = vk, flags = up ? 2u : 0u };
    Send(i);
  }
}
'@
$named = @{ Enter=13; Tab=9; Escape=27; Backspace=8; Space=32; Delete=46; Insert=45; Home=36; End=35; PageUp=33; PageDown=34
  ArrowLeft=37; ArrowUp=38; ArrowRight=39; ArrowDown=40; ShiftLeft=160; ShiftRight=161; ControlLeft=162; ControlRight=163
  AltLeft=164; AltRight=165; MetaLeft=91; MetaRight=92; CapsLock=20; Semicolon=186; Equal=187; Comma=188; Minus=189
  Period=190; Slash=191; Backquote=192; BracketLeft=219; Backslash=220; BracketRight=221; Quote=222 }
function Get-Vk($key) {
  if ($key -cmatch '^Key([A-Z])$') { return [int][char]$Matches[1] }
  if ($key -cmatch '^Digit(\d)$') { return 48 + [int]$Matches[1] }
  if ($key -cmatch '^F(\d{1,2})$' -and [int]$Matches[1] -le 12) { return 111 + [int]$Matches[1] }
  return $named[$key]
}
$buttons = @{ 0 = 2, 4; 1 = 32, 64; 2 = 8, 16 }
$alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
$rng = [Security.Cryptography.RandomNumberGenerator]::Create()
$raw = New-Object byte[] 8; $rng.GetBytes($raw)
$code = -join ($raw | ForEach-Object { $alphabet[$_ % $alphabet.Length] })

$http = New-Object Net.HttpListener
$http.Prefixes.Add("http://127.0.0.1:$port/")
$http.Start()
Write-Host "`n  Remote control code:  $code`n" -ForegroundColor Green
Write-Host "  Enter this code in IT-Tiket, only during a call with your IT team."
Write-Host "  Close this window at any time to stop control immediately.`n"
$wrong = 0
while ($http.IsListening) {
  $ctx = $http.GetContext(); $req = $ctx.Request; $res = $ctx.Response
  $origin = $req.Headers['Origin']
  if ($origins -notcontains $origin) { $res.StatusCode = 403; $res.Close(); continue }
  $res.Headers['Access-Control-Allow-Origin'] = $origin
  $res.Headers['Access-Control-Allow-Headers'] = 'content-type,x-code'
  $res.Headers['Access-Control-Allow-Private-Network'] = 'true'
  if ($req.HttpMethod -eq 'OPTIONS') { $res.Close(); continue }
  if ($req.Headers['x-code'] -cne $code) {
    $res.StatusCode = 401; $res.Close()
    if (++$wrong -ge 5) { Write-Host 'Too many wrong codes. Stopping.' -ForegroundColor Red; break }
    continue
  }
  try {
    $e = (New-Object IO.StreamReader $req.InputStream).ReadToEnd() | ConvertFrom-Json
    switch ($e.t) {
      'move'  { [Input]::Mouse($e.x, $e.y, 0, 0) }
      'down'  { [Input]::Mouse($e.x, $e.y, $buttons[[int]$e.b][0], 0) }
      'up'    { [Input]::Mouse($e.x, $e.y, $buttons[[int]$e.b][1], 0) }
      'wheel' { [Input]::Mouse($e.x, $e.y, 0x800, [int](-[Math]::Sign($e.d) * 120)) }
      'keydown' { $vk = Get-Vk $e.c; if ($vk) { [Input]::Key($vk, $false) } }
      'keyup'   { $vk = Get-Vk $e.c; if ($vk) { [Input]::Key($vk, $true) } }
    }
  } catch { $res.StatusCode = 400 }
  $res.Close()
}
$http.Stop()
