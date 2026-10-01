[CmdletBinding()]
param([string]$DevelopmentRoot)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
if (-not (Get-Command node -ErrorAction SilentlyContinue)) { throw 'Node.js 18 or later is required.' }
$arguments = @((Join-Path $PSScriptRoot 'doctor.js'))
if ($DevelopmentRoot) { $arguments += $DevelopmentRoot }
& node @arguments
exit $LASTEXITCODE
