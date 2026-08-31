[CmdletBinding()]
param(
    [string]$TargetRoot,
    [switch]$SkipPlugins,
    [switch]$NoVerify,
    [switch]$DryRun,
    [switch]$ReplaceExisting
)

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$SourceRoot = [IO.Path]::GetFullPath($PSScriptRoot)
$UserHome = [Environment]::GetFolderPath('UserProfile')
if (-not $TargetRoot) {
    $TargetRoot = if ($env:AGENTIC_DOTNET_HOME) {
        $env:AGENTIC_DOTNET_HOME
    } else {
        Join-Path $UserHome '.agentic-dotnet'
    }
}
$TargetRoot = [IO.Path]::GetFullPath($TargetRoot)

function Write-Note([string]$Message) {
    Write-Host "[bootstrap] $Message"
}

function Copy-Package {
    $timestamp = Get-Date -Format 'yyyy-MM-dd-HHmmss'
    $backupRoot = Join-Path $TargetRoot "backups\bootstrap-$timestamp\package-overwrite"
    $excludedRoots = @('.git', 'backups', 'reports', 'dist')

    foreach ($file in Get-ChildItem -LiteralPath $SourceRoot -File -Recurse -Force) {
        $relative = $file.FullName.Substring($SourceRoot.Length).TrimStart([char[]]@('\', '/'))
        $firstSegment = ($relative -split '[\\/]')[0]
        if ($excludedRoots -contains $firstSegment -or $file.Name -eq '.DS_Store') {
            continue
        }

        $destination = Join-Path $TargetRoot $relative
        if (Test-Path -LiteralPath $destination -PathType Leaf) {
            $sourceHash = (Get-FileHash -LiteralPath $file.FullName -Algorithm SHA256).Hash
            $destinationHash = (Get-FileHash -LiteralPath $destination -Algorithm SHA256).Hash
            if ($sourceHash -eq $destinationHash) {
                continue
            }
        }

        if ($DryRun) {
            Write-Note "WOULD INSTALL $destination"
            continue
        }

        if (Test-Path -LiteralPath $destination) {
            $backup = Join-Path $backupRoot $relative
            New-Item -ItemType Directory -Path (Split-Path -Parent $backup) -Force | Out-Null
            Copy-Item -LiteralPath $destination -Destination $backup -Recurse -Force
            Write-Note "backed up existing $destination"
            if (Test-Path -LiteralPath $destination -PathType Container) {
                Remove-Item -LiteralPath $destination -Recurse -Force
            }
        }

        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
    }
}

if ($SourceRoot -ne $TargetRoot) {
    Write-Note "installing package into $TargetRoot"
    New-Item -ItemType Directory -Path $TargetRoot -Force | Out-Null
    Copy-Package
} else {
    Write-Note "package is already at $TargetRoot"
}

if ($DryRun) {
    Write-Note 'dry run complete; no files or harness settings changed'
    exit 0
}

$installScript = Join-Path $TargetRoot 'scripts\install.ps1'
$previousReplace = [Environment]::GetEnvironmentVariable('AGENTIC_DOTNET_REPLACE_EXISTING')
try {
    if ($ReplaceExisting) {
        $env:AGENTIC_DOTNET_REPLACE_EXISTING = '1'
    }
    & $installScript -SkipPlugins:$SkipPlugins
    $installSucceeded = $?
} finally {
    if ($null -eq $previousReplace) {
        Remove-Item Env:AGENTIC_DOTNET_REPLACE_EXISTING -ErrorAction SilentlyContinue
    } else {
        $env:AGENTIC_DOTNET_REPLACE_EXISTING = $previousReplace
    }
}
if (-not $installSucceeded) {
    throw 'installer failed'
}

if (-not $NoVerify) {
    & (Join-Path $TargetRoot 'scripts\doctor.ps1')
    $doctorSucceeded = $?
    if (-not $doctorSucceeded) {
        throw 'doctor failed'
    }
}

Write-Note "installation complete: $TargetRoot"
