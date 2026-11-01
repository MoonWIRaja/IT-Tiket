param(
    [Parameter(Mandatory=$true)][string]$Path,
    [string]$Query,
    [ValidateRange(1,500)][int]$MaxLines=60,
    [ValidateRange(100,50000)][int]$MaxCharacters=12000,
    [switch]$Raw
)
$ErrorActionPreference='Stop'
$item=Get-Item -LiteralPath $Path
if ($item.PSIsContainer) { throw 'Path must be a text file.' }
if ($Raw) { Get-Content -LiteralPath $item.FullName -Raw -Encoding UTF8; return }
$matches=New-Object System.Collections.Generic.List[object]
$lineNumber=0
$characters=0
$clipped=$false
foreach ($line in [IO.File]::ReadLines($item.FullName)) {
    $lineNumber++
    if ($Query -and $line.IndexOf($Query,[StringComparison]::OrdinalIgnoreCase) -lt 0) { continue }
    if ($matches.Count -ge $MaxLines -or $characters -ge $MaxCharacters) { $clipped=$true; continue }
    $remaining=$MaxCharacters-$characters
    $text=$line
    if ($text.Length -gt $remaining) { $text=$text.Substring(0,$remaining); $clipped=$true }
    $matches.Add([pscustomobject]@{line=$lineNumber;text=$text})
    $characters+=$text.Length
}
[pscustomobject]@{source=$item.FullName;total_lines=$lineNumber;clipped=$clipped;query=$Query;lines=@($matches.ToArray());raw_hint='Use -Raw or a narrower -Query for full evidence. Original file is unchanged.'}|ConvertTo-Json -Depth 5
