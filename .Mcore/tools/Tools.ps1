function Resolve-McoreTool([string]$name) {
    $command = Get-Command $name -CommandType Application -ErrorAction SilentlyContinue | Select-Object -First 1
    if ($command) { return $command.Source }
    $manifest = Get-Content -LiteralPath (Join-Path $PSScriptRoot 'dependencies.json') -Raw | ConvertFrom-Json
    $paths = @(
        (Join-Path $env:USERPROFILE ".local/bin/$name.exe"),
        (Join-Path $env:LOCALAPPDATA "Microsoft/WinGet/Links/$name.exe")
    )
    if ($name -in @('rtk','uv')) { $paths += Join-Path $env:LOCALAPPDATA "MemoryCore/tools/$name-$($manifest.$name.version)/$name.exe" }
    foreach ($path in $paths) { if (Test-Path -LiteralPath $path -PathType Leaf) { return $path } }
    return $null
}
