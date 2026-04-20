#!/usr/bin/env pwsh
# Version sync script for UmbMetrics project
# This script reads the version from UmbMetrics.csproj and updates:
# - Client/package.json
# - Client/.env
# - Client/public/umbraco-package.json

param(
    [string]$NewVersion,
    [switch]$DryRun
)

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor Cyan
}

function Write-Success {
    param([string]$Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function Get-CurrentVersionFromCsproj {
    $csprojPath = "UmbMediaSqueeze.csproj"
    if (-not (Test-Path $csprojPath)) {
        Write-Error "Could not find $csprojPath"
        return $null
    }
    
    $csprojContent = Get-Content $csprojPath -Raw
    
    # Try to find the version in the PropertyGroup that contains PackageId UmbMetrics
    # We'll parse the XML properly to find the right version
    try {
        # Simple XML parsing approach - look for PropertyGroup with PackageId UmbMetrics
        $lines = Get-Content $csprojPath
        $inCorrectPropertyGroup = $false
        $version = $null
        
        foreach ($line in $lines) {
            $trimmedLine = $line.Trim()
            
            if ($trimmedLine -match '<PropertyGroup>') {
                $inCorrectPropertyGroup = $false
            }
            elseif ($trimmedLine -match '<PackageId>UmbMediaSqueeze</PackageId>') {
                $inCorrectPropertyGroup = $true
            }
            elseif ($inCorrectPropertyGroup -and $trimmedLine -match '<Version>([^<]+)</Version>') {
                $version = $matches[1]
                break
            }
            elseif ($trimmedLine -match '</PropertyGroup>') {
                $inCorrectPropertyGroup = $false
            }
        }
        
        if ($version) {
            Write-Info "Current version in csproj: $version"
            return $version
        }
        
        # Fallback: look for any Version tag
        $versionMatch = [regex]::Match($csprojContent, '<Version>([^<]+)</Version>')
        if ($versionMatch.Success) {
            $version = $versionMatch.Groups[1].Value
            Write-Info "Current version in csproj (fallback): $version"
            return $version
        }
        
        Write-Error "Could not find version in $csprojPath"
        return $null
    }
    catch {
        Write-Error "Error parsing $csprojPath : $_"
        return $null
    }
}

function Update-VersionInFile {
    param(
        [string]$FilePath,
        [string]$Pattern,
        [string]$Replacement,
        [string]$Description
    )
    
    if (-not (Test-Path $FilePath)) {
        Write-Warning "File not found: $FilePath"
        return $false
    }
    
    $content = Get-Content $FilePath -Raw
    $newContent = $content -replace $Pattern, $Replacement
    
    if ($content -eq $newContent) {
        Write-Warning "No changes needed in $Description"
        return $false
    }
    
    if ($DryRun) {
        Write-Info "DRY RUN: Would update $Description"
        return $true
    }
    
    try {
        Set-Content -Path $FilePath -Value $newContent -NoNewline
        Write-Success "Updated $Description"
        return $true
    }
    catch {
        Write-Error "Failed to update $Description"
        return $false
    }
}

function Update-PackageJson {
    param([string]$Version)
    
    $filePath = "Client/package.json"
    $pattern = '"version":\s*"[^"]+"'
    $replacement = "`"version`": `"$Version`""
    
    return Update-VersionInFile -FilePath $filePath -Pattern $pattern -Replacement $replacement -Description "package.json"
}

function Update-EnvFile {
    param([string]$Version)
    
    $filePath = "Client/.env"
    $pattern = 'VITE_APP_VERSION=[^\r\n]+'
    $replacement = "VITE_APP_VERSION=$Version"
    
    return Update-VersionInFile -FilePath $filePath -Pattern $pattern -Replacement $replacement -Description ".env file"
}

function Update-UmbracoPackageJson {
    param([string]$Version)
    
    $filePath = "Client/public/umbraco-package.json"
    $pattern = '"version":\s*"[^"]+"'
    $replacement = "`"version`": `"$Version`""
    
    return Update-VersionInFile -FilePath $filePath -Pattern $pattern -Replacement $replacement -Description "umbraco-package.json"
}

function Update-CsprojVersion {
    param([string]$NewVersion)
    
    $filePath = "UmbMediaSqueeze.csproj"
    $pattern = '<Version>[^<]+</Version>'
    $replacement = "<Version>$NewVersion</Version>"
    
    return Update-VersionInFile -FilePath $filePath -Pattern $pattern -Replacement $replacement -Description "csproj file"
}

# Main script execution
Write-Info "Starting version sync script..."

if ($NewVersion) {
    Write-Info "Using provided version: $NewVersion"
    $versionToUse = $NewVersion
} else {
    $versionToUse = Get-CurrentVersionFromCsproj
    if (-not $versionToUse) {
        exit 1
    }
}

# Validate version format (semantic versioning)
if ($versionToUse -notmatch '^\d+\.\d+\.\d+(\.\d+)?$') {
    Write-Warning "Version format may not be standard semantic versioning: $versionToUse"
    Write-Warning "Expected format: major.minor.patch or major.minor.patch.build"
}

Write-Info "Syncing version '$versionToUse' across all files..."

$updatedFiles = 0

# Update csproj if new version was provided
if ($NewVersion) {
    if (Update-CsprojVersion -NewVersion $NewVersion) {
        $updatedFiles++
    }
}

# Update other files
if (Update-PackageJson -Version $versionToUse) { $updatedFiles++ }
if (Update-EnvFile -Version $versionToUse) { $updatedFiles++ }
if (Update-UmbracoPackageJson -Version $versionToUse) { $updatedFiles++ }

if ($DryRun) {
    Write-Info "DRY RUN: Would update $updatedFiles files with version '$versionToUse'"
} else {
    if ($updatedFiles -gt 0) {
        Write-Success "Successfully updated $updatedFiles files with version '$versionToUse'"
    } else {
        Write-Info "No files needed updating. All files already have version '$versionToUse'"
    }
}

Write-Info "Version sync completed."
