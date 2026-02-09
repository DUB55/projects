# build_windows.ps1
# PyInstaller build script voor Windows .exe
param(
    [switch]$Clean = $false,
    [string]$Version = "1.0.0"
)

Write-Host "Building Noordhoff Scraper v$Version" -ForegroundColor Green

# Schoon vorige builds op
if ($Clean) {
    Write-Host "Cleaning previous builds..." -ForegroundColor Yellow
    Remove-Item -Path "dist", "build" -Recurse -Force -ErrorAction SilentlyContinue
}

# Controleer of PyInstaller geïnstalleerd is
try {
    $null = Get-Command pyinstaller -ErrorAction Stop
} catch {
    Write-Host "PyInstaller not found. Installing..." -ForegroundColor Yellow
    pip install pyinstaller
}

# Maak build directory aan
$BuildDir = "build"
$DistDir = "dist"
New-Item -ItemType Directory -Path $BuildDir, $DistDir -Force | Out-Null

# PyInstaller commando
$PyInstallerArgs = @(
    "--name=NoordhoffScraper",
    "--windowed",
    "--onefile",
    "--icon=assets/icon.ico",
    "--add-data=config;config",
    "--add-data=README.md;.",
    "--hidden-import=PyQt6",
    "--hidden-import=playwright",
    "--hidden-import=keyring.backends.Windows",
    "--collect-all=playwright",
    "--clean",
    "--noconfirm",
    "app.py"
)

Write-Host "Running PyInstaller..." -ForegroundColor Cyan
pyinstaller @PyInstallerArgs

# Kopieer extra bestanden
Write-Host "Copying additional files..." -ForegroundColor Cyan
Copy-Item -Path "README.md" -Destination "$DistDir/NoordhoffScraper/" -Force
Copy-Item -Path "config/example_config.json" -Destination "$DistDir/NoordhoffScraper/config/" -Force

# Maak batch script voor eenvoudige installatie
$BatchContent = @"
@echo off
echo Noordhoff Scraper Installatie
echo ==============================
echo.
echo 1. Controleer of Microsoft Visual C++ Redistributable geïnstalleerd is
echo 2. De applicatie start automatisch na installatie
echo.
echo Druk een toets om door te gaan...
pause > nul

start "" "NoordhoffScraper.exe"
"@

$BatchContent | Out-File -FilePath "$DistDir/Start.bat" -Encoding ascii

Write-Host "Build completed!" -ForegroundColor Green
Write-Host "Executable: $DistDir/NoordhoffScraper.exe" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Test de .exe in een clean Windows VM" -ForegroundColor Cyan
Write-Host "2. Installeer Playwright browsers: .\NoordhoffScraper.exe --install-browsers" -ForegroundColor Cyan
Write-Host "3. Zorg dat de gebruiker schrijfrechten heeft in de output directory" -ForegroundColor Cyan

# Laat gebruiker weten dat browsers geïnstalleerd moeten worden
Write-Host ""
Write-Host "IMPORTANT: Playwright browsers must be installed separately!" -ForegroundColor Red
Write-Host "Run this command after installation:" -ForegroundColor Yellow
Write-Host "NoordhoffScraper.exe --install-playwright" -ForegroundColor Yellow