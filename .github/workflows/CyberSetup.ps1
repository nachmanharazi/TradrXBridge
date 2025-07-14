# פונקציה: הצגת גרף שיחות/עבודה (דמו)

function Show-Graph {
    Write-Host "[GRAPH] Demo only, to be expanded later" -ForegroundColor Magenta
}

function Check-WindowsUpdates {
    Write-Host "[INFO] Checking Windows updates..." -ForegroundColor Cyan
    try {
        $updateSession = New-Object -ComObject Microsoft.Update.Session
        $updateSearcher = $updateSession.CreateUpdateSearcher()
        $searchResult = $updateSearcher.Search("IsInstalled=0")
        $count = $searchResult.Updates.Count
        if ($count -gt 0) {
            Write-Host "[WARN] $count updates available!" -ForegroundColor Yellow
        } else {
            Write-Host "[OK] System is up to date." -ForegroundColor Green
        }
    } catch {
        Write-Host "[ERROR] Cannot check updates (maybe no permissions)." -ForegroundColor Red
    }
}

function Open-DefaultBrowser {
    Write-Host "[INFO] Opening default browser..." -ForegroundColor Cyan
    Start-Process "https://www.google.com"
}

function Open-Downloads {
    $downloads = [Environment]::GetFolderPath('MyDocuments').Replace('Documents','Downloads')
    Write-Host "[INFO] Opening Downloads folder..." -ForegroundColor Cyan
    Start-Process "explorer.exe" $downloads
}

function Show-SystemInfo {
    Write-Host "[INFO] System Info:" -ForegroundColor Cyan
    systeminfo | Select-String "OS Name|OS Version|System Type|Total Physical Memory|Available Physical Memory"
}

function Clean-Temp {
    Write-Host "[INFO] Cleaning TEMP files..." -ForegroundColor Cyan
    Remove-Item -Path $env:TEMP\* -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "[OK] TEMP folder cleaned." -ForegroundColor Green
}

function Test-Internet {
    try {
        $ping = Test-Connection -ComputerName 8.8.8.8 -Count 1 -Quiet
        if ($ping) {
            Write-Host "[OK] Internet connection active." -ForegroundColor Green
            return $true
        } else {
            Write-Host "[WARN] No internet connection." -ForegroundColor Red
            return $false
        }
    }
    catch {
        Write-Host "[ERROR] Internet check failed." -ForegroundColor Red
        return $false
    }
}

function Start-Essentials {
    Write-Host "[INFO] Starting essentials..." -ForegroundColor Cyan
    Start-Process "explorer.exe" "$env:USERPROFILE\Desktop\CyberTools"
    Start-Process "notepad.exe"
    Start-Process "cmd.exe"
    try { Start-Process "chrome.exe" } catch {}
    try { Start-Process "code" } catch {}
}

function Add-ToStartup {
    $startup = "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Startup\CyberSetup.lnk"
    $source = "$env:USERPROFILE\Desktop\CyberSetup.lnk"
    if ((Test-Path $source) -and (-not (Test-Path $startup))) {
        Copy-Item $source $startup
        Write-Host "[INFO] Added to autostart." -ForegroundColor Cyan
    }
}

Add-Type -AssemblyName System.Windows.Forms
Add-Type -AssemblyName System.Drawing

function Ensure-Admin {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    if (-not $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
        Write-Host "[ERROR] Please run as administrator!" -ForegroundColor Red
        Start-Sleep -Seconds 2
        Start-Process powershell "-NoProfile -ExecutionPolicy Bypass -File `"$PSCommandPath`"" -Verb RunAs
        exit
    }
}

function Show-Help {
    Write-Host "\n[HELP] Shortcuts:" -ForegroundColor Cyan
    Write-Host "  Ctrl+C    - Exit script"
    Write-Host "  F5        - Rerun in PowerShell ISE"
    Write-Host "  help      - Show this help"
    Write-Host "\n[INFO] All tools will be installed automatically if needed."
    Write-Host "  Alt+R     - Restart computer"
    Write-Host "  Alt+L     - Clean temp files"
    Write-Host "  Alt+S     - Show system performance"
    Write-Host "  Alt+V     - Start voice control"
    Write-Host "  Alt+F     - Manage files"
    Write-Host "  Alt+C     - Check connections"
    Write-Host "  Alt+M     - Memory log"
}
    Write-Host "  Alt+C     - בדוק חיבורים"
    Write-Host "  Alt+M     - זיכרון פקודות/שיחות"
}

function Show-Header {
    Write-Host "=======================================" -ForegroundColor DarkCyan
    Write-Host "     CYBER INIT: ENVIRONMENT SETUP" -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor DarkCyan
}

function Check-Tool {
    param (
        [string]$tool,
        [string]$command,
        [string]$installCmd = $null
    )
    Write-Host "`n[CHECK] בודק $tool..." -ForegroundColor Yellow
    if (Get-Command $command -ErrorAction SilentlyContinue) {
        Write-Host "[OK] $tool מותקן." -ForegroundColor Green
    } else {
        Write-Host "[WARN] $tool לא מותקן." -ForegroundColor Red
        if ($installCmd) {
            Write-Host "[ACTION] מתקין $tool..." -ForegroundColor Cyan
            Invoke-Expression $installCmd
        }
    }
}

function Install-Python-Packages {
    Write-Host "`n[INFO] מתקין/מעדכן חבילות פייתון חיוניות..." -ForegroundColor Cyan
    $packages = @("requests", "scapy", "python-nmap", "colorama")
    foreach ($pkg in $packages) {
        Write-Host "[PY] $pkg..." -ForegroundColor Yellow
        pip install --upgrade $pkg
    }
}

function Create-CyberFolder {
    $folder = "$env:USERPROFILE\Desktop\CyberTools"
    if (-not (Test-Path $folder)) {
        New-Item -ItemType Directory -Path $folder | Out-Null
        Write-Host "[INFO] נוצרה תיקיית CyberTools על שולחן העבודה." -ForegroundColor Green
    } else {
        Write-Host "[INFO] תיקיית CyberTools כבר קיימת." -ForegroundColor Yellow
    }
    # יצירת קיצור דרך
    $shortcut = "$env:USERPROFILE\Desktop\CyberSetup.lnk"
    if (-not (Test-Path $shortcut)) {
        $WshShell = New-Object -ComObject WScript.Shell
        $ShortcutObj = $WshShell.CreateShortcut($shortcut)
        $ShortcutObj.TargetPath = $PSCommandPath
        $ShortcutObj.Save()
        Write-Host "[INFO] נוצר קיצור דרך CyberSetup.lnk על שולחן העבודה." -ForegroundColor Cyan
    }
}

function Finalize {
    Write-Host "`n=======================================" -ForegroundColor DarkCyan
    Write-Host "    SETUP COMPLETED. STAY SHARP." -ForegroundColor Green
    Write-Host "=======================================" -ForegroundColor DarkCyan
    Write-Host "\n[INFO] ניתן להפעיל שוב דרך קיצור הדרך על שולחן העבודה." -ForegroundColor Cyan
    pause
}


    # ...existing code...
        switch ($e.Result.Text) {
            "הפעל דפדפן" { Open-DefaultBrowser }
            "נקה זמניים" { Clean-Temp }
            "הצג ביצועים" { Show-Performance }
        }
    })
    Write-Host "[INFO] מאזין לפקודות קוליות... לחץ Ctrl+C לעצירה." -ForegroundColor Yellow
    while ($true) { Start-Sleep -Seconds 1 }
}

# פונקציה: ניהול קבצים (דמו)
function Manage-Files {
    Write-Host "[INFO] פותח סייר קבצים..." -ForegroundColor Cyan
    Start-Process "explorer.exe" "$env:USERPROFILE"
}



function Check-Connections {
    Write-Host "[INFO] בודק חיבור לשרתים עיקריים..." -ForegroundColor Cyan
    $hosts = @("8.8.8.8","1.1.1.1","www.google.com")
    foreach ($h in $hosts) {
        $r = Test-Connection -ComputerName $h -Count 1 -Quiet
        if ($r) { Write-Host "[OK] $h זמין." -ForegroundColor Green }
        else { Write-Host "[FAIL] $h לא זמין." -ForegroundColor Red }
    }
}

# פונקציה: הפעלה מחדש
function Restart-ComputerQuick {
    Write-Host "[ACTION] מבצע הפעלה מחדש..." -ForegroundColor Magenta
    Restart-Computer -Force
}

# פונקציה: סריקת אנטי-וירוס (דמו)
function Run-AntivirusScan {
    Write-Host "[INFO] סורק וירוסים (דמו)..." -ForegroundColor Cyan
    Start-Process "mrt.exe"
}


# פונקציות עזר
function Upgrade-All {
    for ($i=0; $i -lt 2; $i++) {
        Check-Tool -tool "Python" -command "python" -installCmd "winget install -e --id Python.Python.3"
        Check-Tool -tool "Git" -command "git" -installCmd "winget install -e --id Git.Git"
        Check-Tool -tool "Nmap" -command "nmap" -installCmd "winget install -e --id Nmap.Nmap"
        Check-Tool -tool "Wireshark" -command "wireshark" -installCmd "winget install -e --id WiresharkFoundation.Wireshark"
        Install-Python-Packages
        Start-Sleep -Seconds 1
    }
    Create-CyberFolder
    Finalize
}


# תפריט גרפי ראשי
function Show-MainMenu {
    Ensure-Admin
    $form = New-Object Windows.Forms.Form
    $form.Text = "Desktop AI - עוזר חכם"
    $form.Size = New-Object Drawing.Size(480,540)
    $form.StartPosition = "CenterScreen"
    $form.TopMost = $true

    $label = New-Object Windows.Forms.Label
    $label.Text = "בחר פעולה להפעלה אוטומטית:"
    $label.Location = New-Object Drawing.Point(20,20)
    $label.Size = New-Object Drawing.Size(350,30)
    $label.Font = New-Object Drawing.Font("Arial",12,[Drawing.FontStyle]::Bold)
    $form.Controls.Add($label)

    $y = 60

    # סדר הפעלות: עדכונים, שדרוגים, חיבורים, מראה, עיקרי, עזרים, עזיבה

    $btnWinUpdate = New-Object Windows.Forms.Button
    $btnWinUpdate.Text = "בדוק עדכוני Windows"
    $btnWinUpdate.Location = New-Object Drawing.Point(60,$y)
    $btnWinUpdate.Size = New-Object Drawing.Size(360,35)
    $btnWinUpdate.Font = New-Object Drawing.Font("Arial",10)
    $btnWinUpdate.Add_Click({ Check-WindowsUpdates })
    $form.Controls.Add($btnWinUpdate)
    $y += 40

    $btnUpgrade = New-Object Windows.Forms.Button
    $btnUpgrade.Text = "שדרג והתקן הכל (בלחיצה אחת)"
    $btnUpgrade.Location = New-Object Drawing.Point(60,$y)
    $btnUpgrade.Size = New-Object Drawing.Size(360,40)
    $btnUpgrade.Font = New-Object Drawing.Font("Arial",11)
    $btnUpgrade.Add_Click({
        $btnUpgrade.Enabled = $false
        $label.Text = "פועל..."
        Upgrade-All
        $label.Text = "הסתיים!"
        $btnUpgrade.Enabled = $true
    })
    $form.Controls.Add($btnUpgrade)
    $y += 50

    $btnConn = New-Object Windows.Forms.Button
    $btnConn.Text = "בדוק חיבורים"
    $btnConn.Location = New-Object Drawing.Point(60,$y)
    $btnConn.Size = New-Object Drawing.Size(360,35)
    $btnConn.Font = New-Object Drawing.Font("Arial",10)
    $btnConn.Add_Click({ Check-Connections })
    $form.Controls.Add($btnConn)
    $y += 40

    $btnPerformance = New-Object Windows.Forms.Button
    $btnPerformance.Text = "הצג ביצועי מערכת"
    $btnPerformance.Location = New-Object Drawing.Point(60,$y)
    $btnPerformance.Size = New-Object Drawing.Size(360,35)
    $btnPerformance.Font = New-Object Drawing.Font("Arial",10)
    $btnPerformance.Add_Click({ Show-Performance })
    $form.Controls.Add($btnPerformance)
    $y += 40

    $btnMemory = New-Object Windows.Forms.Button
    $btnMemory.Text = "זיכרון פקודות/שיחות"
    $btnMemory.Location = New-Object Drawing.Point(60,$y)
    $btnMemory.Size = New-Object Drawing.Size(360,35)
    $btnMemory.Font = New-Object Drawing.Font("Arial",10)
    $btnMemory.Add_Click({ Show-Memory })
    $form.Controls.Add($btnMemory)
    $y += 40


    $btnGraph = New-Object Windows.Forms.Button
    $btnGraph.Text = "הצג גרף שיחות/עבודה"
    $btnGraph.Location = New-Object Drawing.Point(60,$y)
    $btnGraph.Size = New-Object Drawing.Size(360,35)
    $btnGraph.Font = New-Object Drawing.Font("Arial",10)
    $btnGraph.Add_Click({ Show-Graph })
    $form.Controls.Add($btnGraph)
    $y += 40

    $btnEssentials = New-Object Windows.Forms.Button
    $btnEssentials.Text = "הפעל תוכנות חיוניות"
    $btnEssentials.Location = New-Object Drawing.Point(60,$y)
    $btnEssentials.Size = New-Object Drawing.Size(360,35)
    $btnEssentials.Font = New-Object Drawing.Font("Arial",10)
    $btnEssentials.Add_Click({ Start-Essentials })
    $form.Controls.Add($btnEssentials)
    $y += 40

    $btnVoice = New-Object Windows.Forms.Button
    $btnVoice.Text = "הפעל שליטה קולית"
    $btnVoice.Location = New-Object Drawing.Point(60,$y)
    $btnVoice.Size = New-Object Drawing.Size(360,35)
    $btnVoice.Font = New-Object Drawing.Font("Arial",10)
    $btnVoice.Add_Click({ Start-VoiceControl })
    $form.Controls.Add($btnVoice)
    $y += 40

    $btnFiles = New-Object Windows.Forms.Button
    $btnFiles.Text = "נהל קבצים"
    $btnFiles.Location = New-Object Drawing.Point(60,$y)
    $btnFiles.Size = New-Object Drawing.Size(360,35)
    $btnFiles.Font = New-Object Drawing.Font("Arial",10)
    $btnFiles.Add_Click({ Manage-Files })
    $form.Controls.Add($btnFiles)
    $y += 40

    $btnBrowser = New-Object Windows.Forms.Button
    $btnBrowser.Text = "פתח דפדפן ברירת מחדל"
    $btnBrowser.Location = New-Object Drawing.Point(60,$y)
    $btnBrowser.Size = New-Object Drawing.Size(360,35)
    $btnBrowser.Font = New-Object Drawing.Font("Arial",10)
    $btnBrowser.Add_Click({ Open-DefaultBrowser })
    $form.Controls.Add($btnBrowser)
    $y += 40

    $btnDownloads = New-Object Windows.Forms.Button
    $btnDownloads.Text = "פתח תיקיית הורדות"
    $btnDownloads.Location = New-Object Drawing.Point(60,$y)
    $btnDownloads.Size = New-Object Drawing.Size(360,35)
    $btnDownloads.Font = New-Object Drawing.Font("Arial",10)
    $btnDownloads.Add_Click({ Open-Downloads })
    $form.Controls.Add($btnDownloads)
    $y += 40

    $btnSysInfo = New-Object Windows.Forms.Button
    $btnSysInfo.Text = "הצג מידע מערכת"
    $btnSysInfo.Location = New-Object Drawing.Point(60,$y)
    $btnSysInfo.Size = New-Object Drawing.Size(360,35)
    $btnSysInfo.Font = New-Object Drawing.Font("Arial",10)
    $btnSysInfo.Add_Click({ Show-SystemInfo })
    $form.Controls.Add($btnSysInfo)
    $y += 40

    $btnClean = New-Object Windows.Forms.Button
    $btnClean.Text = "נקה קבצים זמניים"
    $btnClean.Location = New-Object Drawing.Point(60,$y)
    $btnClean.Size = New-Object Drawing.Size(360,35)
    $btnClean.Font = New-Object Drawing.Font("Arial",10)
    $btnClean.Add_Click({ Clean-Temp })
    $form.Controls.Add($btnClean)
    $y += 40

    $btnStartup = New-Object Windows.Forms.Button
    $btnStartup.Text = "הוסף לאוטוסטארט (הפעלה אוטומטית)"
    $btnStartup.Location = New-Object Drawing.Point(60,$y)
    $btnStartup.Size = New-Object Drawing.Size(360,35)
    $btnStartup.Font = New-Object Drawing.Font("Arial",10)
    $btnStartup.Add_Click({ Add-ToStartup })
    $form.Controls.Add($btnStartup)
    $y += 40

    $btnAntivirus = New-Object Windows.Forms.Button
    $btnAntivirus.Text = "סרוק אנטי-וירוס (דמו)"
    $btnAntivirus.Location = New-Object Drawing.Point(60,$y)
    $btnAntivirus.Size = New-Object Drawing.Size(360,35)
    $btnAntivirus.Font = New-Object Drawing.Font("Arial",10)
    $btnAntivirus.Add_Click({ Run-AntivirusScan })
    $form.Controls.Add($btnAntivirus)
    $y += 40

    $btnHelp = New-Object Windows.Forms.Button
    $btnHelp.Text = "עזרה וקיצורי דרך"
    $btnHelp.Location = New-Object Drawing.Point(60,$y)
    $btnHelp.Size = New-Object Drawing.Size(360,35)
    $btnHelp.Font = New-Object Drawing.Font("Arial",10)
    $btnHelp.Add_Click({ Show-Help })
    $form.Controls.Add($btnHelp)
    $y += 40

    $btnRestart = New-Object Windows.Forms.Button
    $btnRestart.Text = "הפעל מחדש את המחשב"
    $btnRestart.Location = New-Object Drawing.Point(60,$y)
    $btnRestart.Size = New-Object Drawing.Size(360,35)
    $btnRestart.Font = New-Object Drawing.Font("Arial",10)
    $btnRestart.Add_Click({ Restart-ComputerQuick })
    $form.Controls.Add($btnRestart)
    $y += 40

    $btnExit = New-Object Windows.Forms.Button
    $btnExit.Text = "יציאה"
    $btnExit.Location = New-Object Drawing.Point(60,$y)
    $btnExit.Size = New-Object Drawing.Size(360,35)
    $btnExit.Font = New-Object Drawing.Font("Arial",10)
    $btnExit.Add_Click({ $form.Close() })
    $form.Controls.Add($btnExit)

    $form.Add_Shown({$form.Activate()})
    [void]$form.ShowDialog()
}

# הפעלת תפריט ראשי
Show-MainMenu
