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

try {
    New-Item -ItemType Directory -Path $PackageRoot -Force | Out-Null
    New-Item -ItemType Directory -Path $DistDir -Force | Out-Null

    & node (Join-Path $RootDir 'scripts\release-files.js') --stage $PackageRoot
    if ($LASTEXITCODE -ne 0) { throw 'Release manifest staging failed.' }

    $zipPath = Join-Path $DistDir "$PackageName.zip"
    if (Test-Path -LiteralPath $zipPath) {
        Remove-Item -LiteralPath $zipPath -Force
    }
    Add-Type -AssemblyName System.IO.Compression.FileSystem
    [IO.Compression.ZipFile]::CreateFromDirectory($PackageRoot, $zipPath, [IO.Compression.CompressionLevel]::Optimal, $true)

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
