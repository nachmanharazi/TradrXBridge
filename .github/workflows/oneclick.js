// oneclick.js
// One-click autonomous app builder/runner for maximal connectivity and usability
// Runs setup, installs dependencies, checks connections, launches Electron app, and provides feedback

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

const projectDir = __dirname;
const requiredDeps = ['electron', 'axios', 'ssh2', 'basic-ftp'];

function log(msg) {
  process.stdout.write(msg + '\n');
  if (global.mainWindow && global.mainWindow.webContents) {
    global.mainWindow.webContents.send('oneclick-log', msg);
  }
}

function checkAndInstallDeps(cb) {
  log('בודק תלויות...');
  const missing = requiredDeps.filter(dep => {
    try { require.resolve(dep); return false; } catch { return true; }
  });
  if (missing.length === 0) {
    log('כל התלויות מותקנות.');
    cb();
  } else {
    log('מתקין תלויות חסרות: ' + missing.join(', '));
    exec(`npm install ${missing.join(' ')}`, { cwd: projectDir }, (err, stdout, stderr) => {
      if (err) {
        log('שגיאה בהתקנה: ' + stderr);
        process.exit(1);
      } else {
        log('התקנה הושלמה.');
        cb();
      }
    });
  }
}

function checkConfigFiles() {
  log('בודק קבצי קונפיגורציה...');
  const files = ['remote-password.txt', 'memory.json'];
  files.forEach(f => {
    const p = path.join(projectDir, f);
    if (!fs.existsSync(p)) {
      if (f === 'remote-password.txt') fs.writeFileSync(p, '1234');
      if (f === 'memory.json') fs.writeFileSync(p, '[]');
      log(`נוצר קובץ ${f}`);
    }
  });
}

function launchElectron() {
  log('מריץ אפליקציית Electron...');
  exec('npx electron .', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בהרצה: ' + stderr);
      process.exit(1);
    } else {
      log('האפליקציה פועלת!');
    }
  });
}

// פונקציית עדכון עצמי (דוגמה: משיכת קוד מגיטהאב)
function selfUpdate(cb) {
  log('בודק עדכונים מהשרת...');
  exec('git pull', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בעדכון: ' + stderr);
      cb && cb(false);
    } else {
      log('הקוד עודכן:\n' + stdout);
      cb && cb(true);
    }
  });
}

// פונקציה להפעלה מחדש של האפליקציה
function selfRestart() {
  log('מפעיל מחדש את האפליקציה...');
  exec('npx electron .', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בהפעלה מחדש: ' + stderr);
      process.exit(1);
    } else {
      log('הופעל מחדש בהצלחה!');
      process.exit(0);
    }
  });
}

// בדיקת בריאות בסיסית
function healthCheck(cb) {
  log('מריץ בדיקת בריאות...');
  // אפשר להרחיב לבדיקה אמיתית
  let ok = true;
  requiredDeps.forEach(dep => {
    try { require.resolve(dep); } catch { ok = false; log('תלות חסרה: ' + dep); }
  });
  if (ok) log('המערכת בריאה!');
  else log('יש בעיות בתלויות.');
  cb && cb(ok);
}

// פונקציות דוקר
function dockerBuild(cb) {
  log('בונה דימוי Docker...');
  exec('docker build -t electron-ai-app .', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בבניית דימוי: ' + stderr);
      cb && cb(false);
    } else {
      log('הדימוי נבנה בהצלחה!');
      cb && cb(true);
    }
  });
}

function dockerRun(cb) {
  log('מריץ קונטיינר Docker...');
  exec('docker run -d --name electron-ai-app -p 3000:3000 electron-ai-app', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בהרצת קונטיינר: ' + stderr);
      cb && cb(false);
    } else {
      log('הקונטיינר רץ (id: ' + stdout.trim() + ')');
      cb && cb(true);
    }
  });
}

function dockerStatus(cb) {
  exec('docker ps -a --filter name=electron-ai-app', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בבדיקת סטטוס: ' + stderr);
      cb && cb(null);
    } else {
      log('סטטוס קונטיינר:\n' + stdout);
      cb && cb(stdout);
    }
  });
}

function dockerStop(cb) {
  log('עוצר קונטיינר Docker...');
  exec('docker stop electron-ai-app && docker rm electron-ai-app', { cwd: projectDir }, (err, stdout, stderr) => {
    if (err) {
      log('שגיאה בעצירה/מחיקה: ' + stderr);
      cb && cb(false);
    } else {
      log('הקונטיינר נעצר ונמחק.');
      cb && cb(true);
    }
  });
}

// פונקציית שליטה ראשית
function main(action) {
  log('🚀 בניית אפליקציה בלחיצה אחת מתחילה...');
  if (action === 'update') {
    selfUpdate(success => {
      if (success) selfRestart();
    });
  } else if (action === 'restart') {
    selfRestart();
  } else if (action === 'health') {
    healthCheck();
  } else if (action === 'docker-build') {
    dockerBuild();
  } else if (action === 'docker-run') {
    dockerRun();
  } else if (action === 'docker-status') {
    dockerStatus();
  } else if (action === 'docker-stop') {
    dockerStop();
  } else {
    checkAndInstallDeps(() => {
      checkConfigFiles();
      launchElectron();
    });
  }
}

if (require.main === module) {
  // אפשר להעביר פרמטר:
  // node oneclick.js update
  // node oneclick.js restart
  // node oneclick.js health
  // node oneclick.js docker-build
  // node oneclick.js docker-run
  // node oneclick.js docker-status
  // node oneclick.js docker-stop
  const action = process.argv[2] || '';
  main(action);
}


// ניתן להריץ: node oneclick.js
// או להוסיף כפתור UI שמריץ זאת דרך backend/IPC
// דוגמה: node oneclick.js update
// דוגמה: node oneclick.js restart
// דוגמה: node oneclick.js health

if (require.main === module) main();

// ניתן להריץ: node oneclick.js
// או להוסיף כפתור UI שמריץ זאת דרך backend/IPC
