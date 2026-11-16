[CmdletBinding()]
param(
    [switch]$SkipPlugins,
    [switch]$WithOcr
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = if ($env:AGENTIC_DOTNET_HOME) {
    [IO.Path]::GetFullPath($env:AGENTIC_DOTNET_HOME)
} else {
    [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
}
$PluginConfig = Join-Path $RootDir 'config\plugins.yaml'
$UserHome = [Environment]::GetFolderPath('UserProfile')
if ($env:AGENTIC_DOTNET_USER_HOME) { $UserHome = $env:AGENTIC_DOTNET_USER_HOME }
$OpenCodeDir = Join-Path $UserHome '.config\opencode'

function Write-Note([string]$Message) {
    Write-Host "[install] $Message"
}

function Write-InstallWarning([string]$Message) {
    Write-Warning "[install] $Message"
}

function Test-Command([string]$Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Read-DesiredPlugins {
    $active = $false
    foreach ($line in Get-Content -LiteralPath $PluginConfig) {
        if ($line -match '^(core|standard|optional):\s*$') {
            $active = $true
            continue
        }
        if ($line -match '^[A-Za-z_][A-Za-z0-9_-]*:\s*$') {
            $active = $false
        }
        if ($active -and $line -match '^\s*-\s+([A-Za-z0-9_-]+)\s*$') {
            $Matches[1]
        }
    }
}

$plugins = @(Read-DesiredPlugins)
& (Join-Path $RootDir 'scripts\sync.ps1')
$syncSucceeded = $?
if (-not $syncSucceeded) {
    throw 'sync failed'
}

if ($WithOcr) {
    & node (Join-Path $RootDir 'scripts\install-tools.js') --apply
    if ($LASTEXITCODE -ne 0) { throw 'OCR installation failed.' }
}

& node (Join-Path $RootDir 'scripts\t3code.js')
switch ($LASTEXITCODE) {
    0 { }
    4 { Write-InstallWarning 'T3 Code is installed but has not started yet; open it once, then run the doctor' }
    default { Write-InstallWarning 'T3 Code is not installed' }
}

if ($SkipPlugins) {
    Write-Note 'skipping plugin and MCP CLI installation by request'
    exit 0
}

$cursorPresent = (Test-Command 'cursor') -or (Test-Command 'cursor-agent')
if ($cursorPresent) {
    & node (Join-Path $RootDir 'scripts\official-cache.js')
    if ($LASTEXITCODE -ne 0) { throw 'Official Cursor source preparation failed.' }
    & node (Join-Path $RootDir 'scripts\cursor-adapter.js')
    if ($LASTEXITCODE -ne 0) { throw 'Official Cursor deployment failed.' }
}

if (Test-Path -LiteralPath $OpenCodeDir -PathType Container) {
    if (-not $cursorPresent) {
        & node (Join-Path $RootDir 'scripts\official-cache.js')
        if ($LASTEXITCODE -ne 0) { Write-InstallWarning 'Official skill source preparation failed. OpenCode official skills are not wired.' }
    }
    # Sync ran before the official cache existed. Merge again so OpenCode lists its skill directories.
    $BackupStamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
    & node (Join-Path $RootDir 'scripts\opencode-config-merge.js') (Join-Path $OpenCodeDir 'opencode.json') (Join-Path $RootDir "backups\install-$BackupStamp")
    if ($LASTEXITCODE -ne 0) { Write-InstallWarning 'OpenCode config merge failed' }
} else {
    Write-InstallWarning 'OpenCode config directory not present; its instructions, MCP, and official skills are not wired'
}

& node (Join-Path $RootDir 'scripts\install-native.js')
if ($LASTEXITCODE -ne 0) { throw 'Native harness configuration failed.' }

if (Test-Command 'copilot') {
    Write-Note 'Copilot CLI detected; global instructions, shared skills, and MCP config are ready'
    Write-InstallWarning 'No supported dotnet/skills marketplace command was assumed for Copilot CLI'
} else {
    Write-InstallWarning 'Copilot CLI is not installed; its global instructions, skills path, and MCP config are prepared'
}

Write-Note 'installation pass complete'
