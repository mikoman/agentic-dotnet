[CmdletBinding()]
param(
    [switch]$SkipPlugins
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = if ($env:AGENTIC_DOTNET_HOME) {
    [IO.Path]::GetFullPath($env:AGENTIC_DOTNET_HOME)
} else {
    [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
}
$PluginConfig = Join-Path $RootDir 'config\plugins.yaml'

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

if ($SkipPlugins) {
    Write-Note 'skipping plugin and MCP CLI installation by request'
    exit 0
}

if (Test-Command 'codex') {
    $marketplaces = (& codex plugin marketplace list 2>$null | Out-String)
    if ($marketplaces -notmatch 'dotnet-agent-skills') {
        Write-Note 'adding dotnet/skills marketplace to Codex'
        & codex plugin marketplace add dotnet/skills
    }

    $codexState = $null
    try {
        $codexState = (& codex plugin list --available --json 2>$null | Out-String | ConvertFrom-Json)
    } catch {}

    foreach ($plugin in $plugins) {
        $installed = $false
        if ($codexState -and $codexState.installed) {
            $matches = @($codexState.installed | Where-Object {
                $_.name -eq $plugin -and
                $_.marketplaceName -eq 'dotnet-agent-skills' -and
                $_.installed -and
                $_.enabled
            })
            $installed = $matches.Count -gt 0
        }
        if ($installed) {
            Write-Note "Codex already has $plugin"
        } else {
            Write-Note "installing $plugin for Codex"
            & codex plugin add "$plugin@dotnet-agent-skills"
            if ($LASTEXITCODE -ne 0) {
                Write-InstallWarning "Codex plugin failed: $plugin"
            }
        }
    }

    & codex mcp get microsoft-learn *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Note 'adding Microsoft Learn MCP to Codex'
        & codex mcp add microsoft-learn --url https://learn.microsoft.com/api/mcp
    }
} else {
    Write-InstallWarning 'Codex is not installed; its global adapter is prepared'
}

if (Test-Command 'claude') {
    $marketplaces = (& claude plugin marketplace list 2>$null | Out-String)
    if ($marketplaces -notmatch 'dotnet-agent-skills') {
        Write-Note 'adding dotnet/skills marketplace to Claude Code'
        & claude plugin marketplace add --scope user dotnet/skills
    }

    $claudeState = @()
    try {
        $claudeState = @(& claude plugin list --json 2>$null | Out-String | ConvertFrom-Json)
    } catch {}

    foreach ($plugin in $plugins) {
        $pluginId = "$plugin@dotnet-agent-skills"
        $matches = @($claudeState | Where-Object { $_.name -eq $plugin -or $_.id -eq $pluginId })
        if ($matches.Count -gt 0) {
            Write-Note "Claude already has $plugin"
        } else {
            Write-Note "installing $plugin for Claude Code"
            & claude plugin install --scope user --yes $pluginId
            if ($LASTEXITCODE -ne 0) {
                Write-InstallWarning "Claude plugin failed: $plugin"
            }
        }
    }

    & claude mcp get microsoft-learn *> $null
    if ($LASTEXITCODE -ne 0) {
        Write-Note 'adding Microsoft Learn MCP to Claude Code'
        & claude mcp add --scope user --transport http microsoft-learn https://learn.microsoft.com/api/mcp
    }
} else {
    Write-InstallWarning 'Claude Code is not installed; its global adapter is prepared'
}

if (Test-Command 'copilot') {
    Write-Note 'Copilot CLI detected; global instructions, shared skills, and MCP config are ready'
    Write-InstallWarning 'No supported dotnet/skills marketplace command was assumed for Copilot CLI'
} else {
    Write-InstallWarning 'Copilot CLI is not installed; its global instructions, skills path, and MCP config are prepared'
}

Write-Note 'installation pass complete'
