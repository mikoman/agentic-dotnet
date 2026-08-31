[CmdletBinding()]
param()

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

$RootDir = [IO.Path]::GetFullPath((Join-Path $PSScriptRoot '..'))
$Version = (Get-Content -LiteralPath (Join-Path $RootDir 'VERSION') -Raw).Trim()
$PackageName = "agentic-dotnet-$Version"
$DistDir = Join-Path $RootDir 'dist'
$StagingRoot = Join-Path ([IO.Path]::GetTempPath()) ("agentic-dotnet-package-" + [Guid]::NewGuid().ToString('N'))
$PackageRoot = Join-Path $StagingRoot $PackageName
$excludedRoots = @('.git', 'backups', 'reports', 'dist')

try {
    New-Item -ItemType Directory -Path $PackageRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

    foreach ($file in Get-ChildItem -LiteralPath $RootDir -File -Recurse -Force) {
        $relative = $file.FullName.Substring($RootDir.Length).TrimStart([char[]]@('\', '/'))
        $firstSegment = ($relative -split '[\\/]')[0]
        if ($excludedRoots -contains $firstSegment -or $file.Name -eq '.DS_Store') {
            continue
        }
        $destination = Join-Path $PackageRoot $relative
        New-Item -ItemType Directory -Path (Split-Path -Parent $destination) -Force | Out-Null
        Copy-Item -LiteralPath $file.FullName -Destination $destination -Force
    }

    $zipPath = Join-Path $DistDir "$PackageName.zip"
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Compress-Archive -LiteralPath $PackageRoot -DestinationPath $zipPath -CompressionLevel Optimal

    $hash = (Get-FileHash -LiteralPath $zipPath -Algorithm SHA256).Hash.ToLowerInvariant()
    "$hash  $PackageName.zip" |
        Set-Content -LiteralPath (Join-Path $DistDir 'SHA256SUMS') -Encoding ASCII

    Write-Host "[package] created $zipPath"
    Write-Host "[package] checksums $(Join-Path $DistDir 'SHA256SUMS')"
} finally {
    if (Test-Path -LiteralPath $StagingRoot) {
        Remove-Item -LiteralPath $StagingRoot -Recurse -Force
    }
}
