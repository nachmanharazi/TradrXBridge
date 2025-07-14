[Console]::OutputEncoding = [System.Text.Encoding]::UTF8

function Show-Header {
    Write-Host "======================================="
    Write-Host "     CYBER INIT: ENVIRONMENT SETUP"
    Write-Host "======================================="
}

function Check-Tool {
    param (
        [string]$tool,
        [string]$command
    )
    Write-Host "`n[CHECK] Checking $tool..."
    if (Get-Command $command -ErrorAction SilentlyContinue) {
        Write-Host "[OK] $tool is installed."
    } else {
        Write-Host "[WARN] $tool is NOT installed."
    }
}

function Install-Python-Packages {
    Write-Host "`n[INFO] Installing essential Python packages..."
    $packages = @("requests", "scapy", "python-nmap", "colorama")
    foreach ($pkg in $packages) {
        Write-Host "Installing $pkg..."
        pip install $pkg
    }
}

function Create-CyberFolder {
    $folder = "$env:USERPROFILE\\Desktop\\CyberTools"
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "[INFO] Created CyberTools folder on Desktop."
    } else {
        Write-Host "[INFO] CyberTools folder already exists."
    }
}

function Finalize {
    Write-Host "`n======================================="
    Write-Host "    SETUP COMPLETED. STAY SHARP."
    Write-Host "======================================="
    pause
}

# MAIN EXECUTION
Clear-Host
Show-Header

Check-Tool -tool "Python" -command "python"
Check-Tool -tool "Git" -command "git"
Check-Tool -tool "Nmap" -command "nmap"
Check-Tool -tool "Wireshark" -command "wireshark"

Install-Python-Packages
Create-CyberFolder
Finalize
