[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$UserHome = [Environment]::GetFolderPath('UserProfile')
$RootDir = if ($env:AGENTIC_DOTNET_HOME) {
    [IO.Path]::GetFullPath($env:AGENTIC_DOTNET_HOME)
} else {
    [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
}
$GlobalInstructions = Join-Path $RootDir 'instructions\global.md'
$BackupRoot = Join-Path $RootDir ('backups\sync-' + (Get-Date -Format 'yyyy-MM-dd-HHmmss'))
$script:Warnings = 0
$ReplaceExisting = [Environment]::GetEnvironmentVariable('AGENTIC_DOTNET_REPLACE_EXISTING') -eq '1'

function Write-Note([string]$Message) {
    Write-Host "[sync] $Message"
}

function Write-SyncWarning([string]$Message) {
    $script:Warnings++
    Write-Warning "[sync] $Message"
}

function Backup-Path([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        return
    }

    $relative = if ($Path.StartsWith($UserHome, [StringComparison]::OrdinalIgnoreCase)) {
        $Path.Substring($UserHome.Length).TrimStart([char[]]@('\', '/'))
    } else {
        'external\' + (($Path -replace '[:\\/]', '_').TrimStart('_'))
    }

    $destination = Join-Path $BackupRoot $relative
    New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
    Copy-Item -LiteralPath $Path -Destination $destination -Recurse -Force
}

function Test-IsReparsePoint([string]$Path) {
    if (-not (Test-Path -LiteralPath $Path)) {
        return $false
    }
    $item = Get-Item -LiteralPath $Path -Force
    return [bool]($item.Attributes -band [IO.FileAttributes]::ReparsePoint)
}

function Remove-ManagedDestination([string]$Path) {
    if (Test-Path -LiteralPath $Path -PathType Container) {
        Remove-Item -LiteralPath $Path -Recurse -Force
    } else {
        Remove-Item -LiteralPath $Path -Force
    }
    $sidecar = "$Path.agentic-dotnet-managed"
    if (Test-Path -LiteralPath $sidecar) {
        Remove-Item -LiteralPath $sidecar -Force
    }
}

function Test-ManagedRegularFile([string]$Path, [string]$Source, [string]$Mode) {
    if (-not (Test-Path -LiteralPath $Path -PathType Leaf)) {
        return $false
    }
    if (Test-Path -LiteralPath "$Path.agentic-dotnet-managed") {
        return $true
    }
    $content = Get-Content -LiteralPath $Path -Raw -ErrorAction SilentlyContinue
    if ($content -and $content.Contains('.agentic-dotnet')) {
        return $true
    }
    if ($Mode -eq 'ExactCopy') {
        return ((Get-FileHash -LiteralPath $Path -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash)
    }
    return $false
}

function New-ManagedLinkOrFallback {
    param(
        [Parameter(Mandatory)][string]$Source,
        [Parameter(Mandatory)][string]$Destination,
        [ValidateSet('Content', 'ExactCopy', 'Directory')][string]$Mode
    )

    New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null

    if (Test-Path -LiteralPath $Destination) {
        if (Test-IsReparsePoint $Destination) {
            try {
                if ((Resolve-Path -LiteralPath $Destination).Path -eq (Resolve-Path -LiteralPath $Source).Path) {
                    Write-Note "ok link $Destination"
                    return
                }
            } catch {}
            Backup-Path $Destination
            Remove-ManagedDestination $Destination
        } elseif ($Mode -ne 'Directory' -and (Test-ManagedRegularFile $Destination $Source $Mode)) {
            $currentContent = Get-Content -LiteralPath $Destination -Raw -ErrorAction SilentlyContinue
            $sourceContent = Get-Content -LiteralPath $Source -Raw
            $isCurrent = if ($Mode -eq 'ExactCopy') {
                (Get-FileHash -LiteralPath $Destination -Algorithm SHA256).Hash -eq (Get-FileHash -LiteralPath $Source -Algorithm SHA256).Hash
            } else {
                $currentContent -and $currentContent.Contains($sourceContent.Trim())
            }
            if ($isCurrent) {
                Write-Note "ok generated fallback $Destination"
                return
            }
            Backup-Path $Destination
            Remove-ManagedDestination $Destination
        } else {
            Backup-Path $Destination
            if ($ReplaceExisting) {
                Remove-ManagedDestination $Destination
            } else {
                Write-SyncWarning "left unrelated path in place: $Destination"
                return
            }
        }
    }

    try {
        New-Item -ItemType SymbolicLink -Path $Destination -Target $Source -ErrorAction Stop | Out-Null
        Write-Note "linked $Destination -> $Source"
        return
    } catch {
        if ($Mode -eq 'Directory') {
            try {
                New-Item -ItemType Junction -Path $Destination -Target $Source -ErrorAction Stop | Out-Null
                Write-Note "junction $Destination -> $Source"
                return
            } catch {
                Write-SyncWarning "could not create skill link or junction: $Destination"
                return
            }
        }
    }

    if ($Mode -eq 'Content') {
        $header = "<!-- Managed by .agentic-dotnet; edit $Source instead. -->`r`n"
        $header + (Get-Content -LiteralPath $Source -Raw) |
            Set-Content -LiteralPath $Destination -Encoding UTF8
    } else {
        Copy-Item -LiteralPath $Source -Destination $Destination -Force
        'managed by .agentic-dotnet' |
            Set-Content -LiteralPath "$Destination.agentic-dotnet-managed" -Encoding ASCII
    }
    Write-Note "generated managed fallback $Destination"
}

function Set-ManagedTextFile([string]$Destination, [string]$Content) {
    New-Item -ItemType Directory -Path (Split-Path -Parent $Destination) -Force | Out-Null
    if (Test-Path -LiteralPath $Destination) {
        $existing = Get-Content -LiteralPath $Destination -Raw -ErrorAction SilentlyContinue
        if ($existing -eq $Content) {
            Write-Note "ok file $Destination"
            return
        }
        if (-not ($existing -and $existing.Contains('.agentic-dotnet'))) {
            Backup-Path $Destination
            if ($ReplaceExisting) {
                Remove-ManagedDestination $Destination
            } else {
                Write-SyncWarning "left unrelated file in place: $Destination"
                return
            }
        }
        Backup-Path $Destination
    }
    $Content | Set-Content -LiteralPath $Destination -Encoding UTF8 -NoNewline
    Write-Note "updated $Destination"
}

if (-not (Test-Path -LiteralPath $GlobalInstructions -PathType Leaf)) {
    throw "missing canonical instructions: $GlobalInstructions"
}

foreach ($directory in @(
    (Join-Path $RootDir 'skills'),
    (Join-Path $UserHome '.codex'),
    (Join-Path $UserHome '.claude'),
    (Join-Path $UserHome '.agents\skills'),
    (Join-Path $UserHome '.copilot')
)) {
    New-Item -ItemType Directory -Path $directory -Force | Out-Null
}

New-ManagedLinkOrFallback -Source $GlobalInstructions -Destination (Join-Path $UserHome '.codex\AGENTS.md') -Mode Content

$claudePath = $GlobalInstructions -replace '\\', '/'
$claudeContent = "<!-- Managed by .agentic-dotnet; edit $claudePath instead. -->`r`n@$claudePath`r`n"
Set-ManagedTextFile -Destination (Join-Path $UserHome '.claude\CLAUDE.md') -Content $claudeContent

New-ManagedLinkOrFallback -Source $GlobalInstructions -Destination (Join-Path $UserHome '.copilot\copilot-instructions.md') -Mode Content
New-ManagedLinkOrFallback -Source (Join-Path $RootDir 'adapters\copilot\mcp-config.json') -Destination (Join-Path $UserHome '.copilot\mcp-config.json') -Mode ExactCopy

foreach ($skill in Get-ChildItem -LiteralPath (Join-Path $RootDir 'skills') -Directory -ErrorAction SilentlyContinue) {
    if (-not (Test-Path -LiteralPath (Join-Path $skill.FullName 'SKILL.md'))) {
        Write-SyncWarning "missing SKILL.md in $($skill.FullName)"
        continue
    }
    New-ManagedLinkOrFallback -Source $skill.FullName -Destination (Join-Path $UserHome ".agents\skills\$($skill.Name)") -Mode Directory
    New-ManagedLinkOrFallback -Source $skill.FullName -Destination (Join-Path $UserHome ".claude\skills\$($skill.Name)") -Mode Directory
}

if (Test-Path -LiteralPath $BackupRoot) {
    $backupItems = @(Get-ChildItem -LiteralPath $BackupRoot -Recurse -Force -ErrorAction SilentlyContinue)
    if ($backupItems.Count -gt 0) {
        Write-Note "backup: $BackupRoot"
    } else {
        Remove-Item -LiteralPath $BackupRoot -Force
    }
}

Write-Note "completed with $script:Warnings warning(s)"
