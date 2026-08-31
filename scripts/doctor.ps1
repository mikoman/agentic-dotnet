[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Continue'

$UserHome = [Environment]::GetFolderPath('UserProfile')
$RootDir = if ($env:AGENTIC_DOTNET_HOME) {
    [IO.Path]::GetFullPath($env:AGENTIC_DOTNET_HOME)
} else {
    [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
}
$GlobalInstructions = Join-Path $RootDir 'instructions\global.md'
$script:Pass = 0
$script:Warn = 0
$script:Fail = 0

function Add-Pass([string]$Message) {
    $script:Pass++
    Write-Host "PASS  $Message"
}

function Add-Warn([string]$Message) {
    $script:Warn++
    Write-Host "WARN  $Message"
}

function Add-Fail([string]$Message) {
    $script:Fail++
    Write-Host "FAIL  $Message"
}

function Test-Command([string]$Name) {
    return $null -ne (Get-Command $Name -ErrorAction SilentlyContinue)
}

function Test-ContainsCanonical([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $false
    }
    if (-not (Test-Path -LiteralPath $GlobalInstructions -PathType Leaf)) {
        return $false
    }
    $canonical = (Get-Content -LiteralPath $GlobalInstructions -Raw).Trim()
    $actual = Get-Content -LiteralPath $Path -Raw
    return $actual.Contains($canonical)
}

function Read-DesiredPlugins {
    $active = $false
    foreach ($line in Get-Content -LiteralPath (Join-Path $RootDir 'config\plugins.yaml')) {
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

if (Test-Path -LiteralPath $GlobalInstructions -PathType Leaf) {
    Add-Pass 'canonical global instructions'
} else {
    Add-Fail 'canonical global instructions'
}

if (Test-ContainsCanonical (Join-Path $UserHome '.codex\AGENTS.md')) {
    Add-Pass 'Codex global AGENTS.md adapter'
} else {
    Add-Fail 'Codex global AGENTS.md adapter'
}

$claudeFile = Join-Path $UserHome '.claude\CLAUDE.md'
$claudePath = $GlobalInstructions -replace '\\', '/'
if ((Test-Path -LiteralPath $claudeFile) -and (Get-Content -LiteralPath $claudeFile -Raw).Contains("@$claudePath")) {
    Add-Pass 'Claude global instructions adapter'
} else {
    Add-Fail 'Claude global instructions adapter'
}

if (Test-ContainsCanonical (Join-Path $UserHome '.copilot\copilot-instructions.md')) {
    Add-Pass 'Copilot global instructions adapter'
} else {
    Add-Fail 'Copilot global instructions adapter'
}

$copilotMcp = Join-Path $UserHome '.copilot\mcp-config.json'
if ((Test-Path -LiteralPath $copilotMcp) -and (Get-Content -LiteralPath $copilotMcp -Raw).Contains('https://learn.microsoft.com/api/mcp')) {
    Add-Pass 'Copilot Microsoft Learn MCP adapter'
} else {
    Add-Fail 'Copilot Microsoft Learn MCP adapter'
}

$skillFailures = @()
foreach ($skill in Get-ChildItem -LiteralPath (Join-Path $RootDir 'skills') -Directory -ErrorAction SilentlyContinue) {
    foreach ($destination in @(
        (Join-Path $UserHome ".agents\skills\$($skill.Name)"),
        (Join-Path $UserHome ".claude\skills\$($skill.Name)")
    )) {
        if (-not (Test-Path -LiteralPath $destination)) {
            $skillFailures += $destination
        }
    }
}
if ($skillFailures.Count -eq 0) {
    Add-Pass 'custom Agent Skills links'
} else {
    Add-Fail ('custom Agent Skills links: ' + ($skillFailures -join ', '))
}

if (Test-Command 'dotnet') {
    $sdks = (& dotnet --list-sdks 2>$null | Out-String).Trim()
    if ($sdks) { Add-Pass "dotnet SDKs: $sdks" } else { Add-Warn 'dotnet SDK status unavailable' }
} else {
    Add-Warn 'dotnet executable unavailable'
}

$plugins = @(Read-DesiredPlugins)
if (Test-Command 'codex') {
    try {
        $state = (& codex plugin list --available --json 2>$null | Out-String | ConvertFrom-Json)
        foreach ($plugin in $plugins) {
            $entries = @($state.installed | Where-Object {
                $_.name -eq $plugin -and
                $_.marketplaceName -eq 'dotnet-agent-skills' -and
                $_.installed -and
                $_.enabled
            })
            if ($entries.Count -gt 0) { Add-Pass "Codex plugin $plugin" } else { Add-Warn "Codex plugin not confirmed: $plugin" }
        }
    } catch {
        Add-Warn 'Codex plugin status could not be parsed'
    }
    & codex mcp get microsoft-learn *> $null
    if ($LASTEXITCODE -eq 0) { Add-Pass 'Codex Microsoft Learn MCP' } else { Add-Warn 'Codex Microsoft Learn MCP' }
} else {
    Add-Warn 'Codex not installed'
}

if (Test-Command 'claude') {
    try {
        $state = @(& claude plugin list --json 2>$null | Out-String | ConvertFrom-Json)
        foreach ($plugin in $plugins) {
            $pluginId = "$plugin@dotnet-agent-skills"
            $entries = @($state | Where-Object { $_.name -eq $plugin -or $_.id -eq $pluginId })
            if ($entries.Count -gt 0) { Add-Pass "Claude plugin $plugin" } else { Add-Warn "Claude plugin not confirmed: $plugin" }
        }
    } catch {
        Add-Warn 'Claude plugin status could not be parsed'
    }
    & claude mcp get microsoft-learn *> $null
    if ($LASTEXITCODE -eq 0) { Add-Pass 'Claude Microsoft Learn MCP' } else { Add-Warn 'Claude Microsoft Learn MCP' }
} else {
    Add-Warn 'Claude Code not installed'
}

if (Test-Command 'copilot') {
    Add-Pass 'Copilot CLI installed'
} else {
    Add-Warn 'Copilot CLI unavailable (prepared config only)'
}

Write-Host ''
Write-Host "Summary: $($script:Pass) pass, $($script:Warn) warn, $($script:Fail) fail"
if ($script:Fail -gt 0) { exit 1 }
exit 0
