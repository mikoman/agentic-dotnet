[CmdletBinding()]
param([switch]$Apply, [ValidateSet('codex', 'claude')][string]$Harness)
$arguments = @((Join-Path $PSScriptRoot 'update.js'))
if ($Apply) { $arguments += '--apply' }
if ($Harness) { $arguments += "--harness=$Harness" }
& node @arguments
exit $LASTEXITCODE
