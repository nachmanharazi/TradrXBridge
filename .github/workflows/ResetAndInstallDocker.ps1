Write-Host "======== Reset and Install Docker ========"

# Step 1: Remove old Docker folders
$pathsToDelete = @(
  "C:\Program Files\Docker",
  "$env:USERPROFILE\AppData\Local\Docker",
  "$env:USERPROFILE\AppData\Roaming\Docker"
)

foreach ($path in $pathsToDelete) {
  if (Test-Path $path) {
    Remove-Item -Recurse -Force $path
    Write-Host "Deleted: $path"
  } else {
    Write-Host "Already clean: $path"
  }
}

# Step 2: Check WSL2
Write-Host "`n======== Checking WSL2 ========"

try {
  $wslOutput = wsl.exe --version 2>$null
  Write-Host "WSL2 is installed"
} catch {
  Write-Host "WSL2 is not installed. Run: wsl --install"
  exit
}

# Step 3: Download Docker installer
Write-Host "`n======== Downloading Docker Installer ========"

$installerUrl = "https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe"
$installerPath = "$env:TEMP\DockerInstaller.exe"

try {
  Invoke-WebRequest -Uri $installerUrl -OutFile $installerPath -UseBasicParsing
  Write-Host "Downloaded to: $installerPath"
} catch {
  Write-Host "Download failed. Please check internet connection."
  exit
}

# Step 4: Install Docker
Write-Host "`n======== Installing Docker ========"

Start-Process -FilePath $installerPath -ArgumentList "install --quiet --accept-license" -Verb RunAs -Wait

Start-Sleep -Seconds 10

# Step 5: Verify installation
Write-Host "`n======== Verifying Installation ========"

$dockerExePath = "$env:ProgramFiles\Docker\Docker\resources\bin\docker.exe"

if (Test-Path $dockerExePath) {
  $dockerVersion = & $dockerExePath --version
  Write-Host "Docker installed successfully:"
  Write-Host $dockerVersion
} else {
  Write-Host "Docker not found. Please restart your computer and try again."
}

Write-Host "`n======== Done ========"
