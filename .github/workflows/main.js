const { app, BrowserWindow, ipcMain, protocol } = require('electron');
const path = require('path');
const fs = require('fs');
let mainWindow;
let getFolderTree;

try {
  getFolderTree = require('./utils').getFolderTree;
} catch(e) {
  console.error('[ERROR] Failed to require utils.js:', e);
  getFolderTree = ()=>({error:'utils.js missing'});
}

function createWindow() {
  console.log('[DEBUG] createWindow called');
  let win;
  try {
    win = new BrowserWindow({
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        preload: path.join(__dirname, 'preload.js')
      }
    });
    console.log('[DEBUG] BrowserWindow created');
  } catch (e) {
    console.error('[ERROR] BrowserWindow failed:', e);
    throw e;
  }
  win.loadURL('app://./index.html').then(() => {
    console.log('[DEBUG] index.html loaded');
  }).catch(e => {
    console.error('[ERROR] Failed to load index.html:', e);
  });

  // שלח עץ תיקיות אוטומטי ברגע שהחלון נטען
  win.webContents.on('did-finish-load', () => {
    try {
      const projectDir = __dirname;
      const tree = getFolderTree(projectDir);
      win.webContents.send('folder-tree', tree);
      console.log('[DEBUG] folder-tree sent');
    } catch (e) {
      console.error('[ERROR] getFolderTree failed:', e);
    }
  });
}

// --- Versioning IPC ---

// טיפול בשגיאות לא מטופלות
process.on('uncaughtException', (err) => {
  console.error('[UNCAUGHT EXCEPTION]', err);
});
process.on('unhandledRejection', (reason, p) => {
  console.error('[UNHANDLED REJECTION]', reason);
});
ipcMain.handle('list-versions', (event, filePath) => versioning.listVersions(filePath));
ipcMain.handle('load-version', (event, versionFile) => versioning.loadVersion(versionFile));

// --- AI/Agent Chat Handler ---
const OPENAI_API_KEY = process.env.OPENAI_API_KEY || null;
const axios = require('axios');

// --- עץ תיקיות אוטומטי ---
function sendFolderTree(win) {
  const projectDir = __dirname;
  const tree = getFolderTree(projectDir);
  win.webContents.send('folder-tree', tree);
}

ipcMain.handle('ask-ai', async (event, msg) => {
  if (OPENAI_API_KEY) {
    // שלח ל-OpenAI (GPT-3.5/4)
    try {
      const res = await axios.post('https://api.openai.com/v1/chat/completions', {
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'אתה עוזר חכם שמבצע פקודות מחשב, מסביר, ומגיב בעברית.' },
          { role: 'user', content: msg }
        ]
      }, {
        headers: {
          'Authorization': `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json'
        }
      });
      return res.data.choices[0].message.content;
    } catch (e) {
      return 'שגיאה: לא הצלחתי ליצור קשר עם OpenAI.';
    }
  } else {
    // מוח דמה: מחזיר תשובה דמיונית
    if (msg.includes('קובץ') && msg.includes('צור')) return 'יצרתי עבורך קובץ חדש!';
    if (msg.includes('מחק')) return 'מחקתי את הקובץ שביקשת.';
    if (msg.includes('שלום')) return 'שלום! איך אפשר לעזור?';
    if (msg.includes('מה השעה')) return 'השעה עכשיו: ' + new Date().toLocaleTimeString('he-IL');
    return 'אני מוח דמיוני. כדי שאוכל לבצע פקודות אמיתיות, יש להכניס OpenAI API Key.';
  }
});

// --- Agents API IPC Handlers ---
let agents = {};
try {
    // Load agents from the interlink file
    agents = require(path.join(__dirname, 'src/agent/interlink.js'));
    console.log('[AGENT_LOADER] Successfully loaded agents:', Object.keys(agents).join(', '));

    // Handler to get the list of available agents
    ipcMain.handle('get-agents', () => {
        return Object.keys(agents);
    });

    // Handler to call a specific function on a specific agent
    ipcMain.handle('call-agent', async (event, { agentName, funcName, args }) => {
        if (agents[agentName] && typeof agents[agentName][funcName] === 'function') {
            try {
                // Use 'await' in case the agent function is async
                const result = await agents[agentName][funcName](...args);
                return { success: true, data: result };
            } catch (error) {
                console.error(`[AGENT_CALL_ERROR] Error calling ${agentName}.${funcName}:`, error);
                return { success: false, error: error.message };
            }
        }
        console.error(`[AGENT_CALL_ERROR] Agent or function not found: ${agentName}.${funcName}`);
        return { success: false, error: 'Agent or function not found' };
    });

} catch (e) {
    console.error('[AGENT_LOADER] Failed to load agents from interlink.js:', e);
    // Create dummy handlers if loading fails so the app doesn't crash
    ipcMain.handle('get-agents', () => []);
    ipcMain.handle('call-agent', () => ({ success: false, error: 'Agent system failed to load.' }));
}

// --- Unified Notification/Log/Override IPC Handlers ---
ipcMain.handle('log-action', async (event, entry) => {
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, 'log-action.log');
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    return { success: true };
  } catch (e) {
    console.error('[LOG_ACTION_ERROR]', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('transparency-log', async (event, entry) => {
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, 'transparency.log');
    fs.appendFileSync(logPath, JSON.stringify(entry) + '\n');
    return { success: true };
  } catch (e) {
    console.error('[TRANSPARENCY_LOG_ERROR]', e);
    return { success: false, error: e.message };
  }
});
ipcMain.handle('override-api', async (event, { action, payload }) => {
  try {
    const fs = require('fs');
    const logPath = path.join(__dirname, 'override.log');
    fs.appendFileSync(logPath, JSON.stringify({ action, payload, time: new Date().toISOString() }) + '\n');
    // Here you could implement custom override logic if needed
    return { success: true };
  } catch (e) {
    console.error('[OVERRIDE_API_ERROR]', e);
    return { success: false, error: e.message };
  }
});

app.whenReady().then(() => {
  protocol.registerFileProtocol('app', (request, callback) => {
    const url = request.url.substr(6);
    callback({ path: path.join(__dirname, url) });
  });

  createWindow();
  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

// --- System AI Control IPC handlers ---
ipcMain.handle('listProcesses', async () => {
  const { execSync } = require('child_process');
  try {
    let output = '';
    if (process.platform === 'win32') {
      output = execSync('tasklist', { encoding: 'utf8' });
    } else {
      output = execSync('ps aux', { encoding: 'utf8' });
    }
    console.log('[AI LOG] Listed processes');
    return output;
  } catch (e) {
    return 'Error listing processes: ' + e.message;
  }
});

ipcMain.handle('killProcess', async (event, name) => {
  const { execSync } = require('child_process');
  try {
    let cmd = '';
    if (process.platform === 'win32') {
      cmd = `taskkill /IM "${name}" /F`;
    } else {
      cmd = `pkill -f "${name}"`;
    }
    const output = execSync(cmd, { encoding: 'utf8' });
    console.log(`[AI LOG] Killed process: ${name}`);
    return output;
  } catch (e) {
    return 'Error killing process: ' + e.message;
  }
});

ipcMain.handle('launchProcess', async (event, cmd) => {
  const { exec } = require('child_process');
  try {
    exec(cmd, (err, stdout, stderr) => {
      if (err) console.error('[AI LOG] Error launching process:', err);
      if (stdout) console.log('[AI LOG] Launch stdout:', stdout);
      if (stderr) console.log('[AI LOG] Launch stderr:', stderr);
    });
    console.log(`[AI LOG] Launched process: ${cmd}`);
    return 'Launched: ' + cmd;
  } catch (e) {
    return 'Error launching process: ' + e.message;
  }
});

ipcMain.handle('get-memory-usage', async () => {
    return process.memoryUsage();
});

setInterval(() => {
    const memoryUsage = process.memoryUsage();
    console.log(`[MEMORY_MONITOR] RSS: ${(memoryUsage.rss / 1024 / 1024).toFixed(2)} MB, Heap Used: ${(memoryUsage.heapUsed / 1024 / 1024).toFixed(2)} MB`);
}, 10000); // Log memory usage every 10 seconds

ipcMain.handle('getSystemInfo', async () => {
  const os = require('os');
  try {
    const info = {
      platform: os.platform(),
      arch: os.arch(),
      cpus: os.cpus().length,
      totalmem: os.totalmem(),
      freemem: os.freemem(),
      uptime: os.uptime(),
      user: os.userInfo().username
    };
    console.log('[AI LOG] System info requested');
    return JSON.stringify(info, null, 2);
  } catch (e) {
    return 'Error getting system info: ' + e.message;
  }
});

ipcMain.handle('runCommand', async (event, command) => {
  const { execSync } = require('child_process');
  // SAFETY: block obviously dangerous commands
  if (/rm\s+-rf|format|shutdown|del\s+\//i.test(command)) {
    return 'Blocked potentially dangerous command.';
  }
  try {
    const output = execSync(command, { encoding: 'utf8' });
    console.log(`[AI LOG] Ran command: ${command}`);
    return output;
  } catch (e) {
    return 'Error running command: ' + e.message;
  }
});

// --- Python and Network Orchestration IPC ---
ipcMain.handle('runPython', async (event, { scriptPath, args }) => {
  const { spawnSync } = require('child_process');
  try {
    const result = spawnSync('python', [scriptPath, ...(args||[])], { encoding: 'utf8' });
    console.log(`[AI LOG] Ran Python: ${scriptPath} ${args ? args.join(' ') : ''}`);
    return { stdout: result.stdout, stderr: result.stderr };
  } catch (e) {
    return { error: e.message };
  }
});

ipcMain.handle('listPythonEnvs', async () => {
  const { execSync } = require('child_process');
  try {
    let output = '';
    if (process.platform === 'win32') {
      output = execSync('where python', { encoding: 'utf8' });
    } else {
      output = execSync('which -a python', { encoding: 'utf8' });
    }
    console.log('[AI LOG] Listed Python environments');
    return output;
  } catch (e) {
    return 'Error listing Python environments: ' + e.message;
  }
});

ipcMain.handle('scanNetwork', async (event, { subnet }) => {
  // Simple ping scan (for demonstration)
  const { execSync } = require('child_process');
  try {
    let results = [];
    for (let i = 1; i <= 10; i++) { // scan .1-.10
      const ip = `${subnet}.${i}`;
      try {
        let res = execSync(`ping -n 1 -w 300 ${ip}`, { encoding: 'utf8' });
        if (res.includes('TTL=')) results.push(ip);
      } catch {}
    }
    console.log(`[AI LOG] Scanned network: ${subnet}.x`);
    return results;
  } catch (e) {
    return { error: e.message };
  }
});

// IPC handlers for renderer to main
ipcMain.handle('select-folder', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openDirectory']
  });
  if (canceled) return null;
  return filePaths[0];
});

ipcMain.handle('write-file', async (event, filePath, content) => {
  // שמור גרסה לפני דריסה
  try { versioning.saveVersion(filePath, fs.readFileSync(filePath, 'utf8')); } catch(e){}

  fs.writeFileSync(filePath, content, 'utf8');
  return true;
});

ipcMain.handle('read-folder-files', async (event, folderPath) => {
  return fs.readdirSync(folderPath);
});

ipcMain.handle('send-system-command', async (event, command) => {
  const execSync = require('child_process').execSync;
  try {
    const output = execSync(command, { encoding: 'utf8' });
    return output;
  } catch (err) {
    return err.message;
  }
});

ipcMain.handle('send-to-ai', async (event, { prompt }) => {
  // Stub for AI integration
  return `AI response to: ${prompt}`;
});

// קריאת קובץ טקסט
ipcMain.handle('read-file', async (event, filePath) => {
  try {
    return fs.readFileSync(filePath, 'utf8');
  } catch (err) {
    return '';
  }
});

ipcMain.handle('cleanTempDir', async () => {
  const os = require('os');
  const tempDir = os.tmpdir();
  let deletedCount = 0;
  const oneDayAgo = Date.now() - (24 * 60 * 60 * 1000);

  try {
    const files = fs.readdirSync(tempDir);
    for (const file of files) {
      const filePath = path.join(tempDir, file);
      try {
        const stats = fs.statSync(filePath);
        if (stats.isFile() && stats.mtime.getTime() < oneDayAgo) {
          fs.unlinkSync(filePath);
          deletedCount++;
        }
      } catch (err) {
        // Ignore errors for single files (e.g., permission denied, file in use)
        console.warn(`[TempClean] Could not process file: ${filePath} - ${err.message}`);
      }
    }
    console.log(`[AI LOG] Cleaned temp directory. Deleted ${deletedCount} files.`);
    return { success: true, deletedCount };
  } catch (e) {
    console.error('[AI LOG] Error cleaning temp directory:', e.message);
    return { success: false, error: e.message, deletedCount: 0 };
  }
});
