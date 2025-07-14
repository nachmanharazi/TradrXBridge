const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');

// Create logs directory if it doesn't exist
const logDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
}

const logFile = path.join(logDir, 'docker-diagnostic.log');
const output = [];

// Override console.log to capture output
const originalConsoleLog = console.log;
console.log = function(...args) {
    const message = args.map(arg => 
        typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg)
    ).join(' ');
    
    output.push(message);
    originalConsoleLog.apply(console, args);
};

console.log('=== Docker Environment Diagnostics ===\n');
console.log(`Diagnostic started at: ${new Date().toISOString()}\n`);

// System information
console.log('## System Information');
try {
  console.log(`- Node.js Version: ${process.version}`);
  console.log(`- Platform: ${process.platform}`);
  console.log(`- Architecture: ${process.arch}`);
  console.log(`- CPU Cores: ${require('os').cpus().length}`);
  console.log(`- Total Memory: ${Math.round(require('os').totalmem() / (1024 * 1024))} MB`);
  console.log(`- Free Memory: ${Math.round(require('os').freemem() / (1024 * 1024))} MB`);
  
  // Environment variables
  console.log('\n## Environment Variables');
  Object.keys(process.env)
    .filter(key => key.match(/^(NODE|ELECTRON|DISPLAY|XDG|PATH|HOME|USER)/i))
    .forEach(key => console.log(`- ${key}=${process.env[key]}`));
  
  // Check important directories and files
  console.log('\n## Directory Structure');
  const checkDirs = ['/', '/app', '/app/node_modules'];
  checkDirs.forEach(dir => {
    try {
      const stat = fs.statSync(dir);
      console.log(`- ${dir}: ${stat.isDirectory() ? 'Directory' : 'File'}`);
      if (dir === '/app') {
        console.log('  Contents:', fs.readdirSync(dir).join(', '));
      }
    } catch (e) {
      console.log(`- ${dir}: ${e.message}`);
    }
  });
  
  // Check for required binaries
  console.log('\n## Required Binaries');
  const binaries = ['node', 'npm', 'electron', 'Xvfb', 'xrandr'];
  binaries.forEach(bin => {
    try {
      const path = execSync(`which ${bin} || echo not found`, { stdio: 'pipe' }).toString().trim();
      let version = 'unknown';
      if (path !== 'not found') {
        try {
          version = execSync(`${bin} --version`, { stdio: 'pipe' }).toString().trim();
        } catch (e) {
          version = 'version check failed';
        }
      }
      console.log(`- ${bin}: ${path} (${version})`);
    } catch (e) {
      console.log(`- ${bin}: check failed`);
    }
  });
  
  // Check for display server
  console.log('\n## Display Server');
  try {
    const xdpyinfo = execSync('xdpyinfo 2>&1 || echo not available', { stdio: 'pipe' }).toString().trim();
    console.log(xdpyinfo === 'not available' ? 'X11 display server not available' : 'X11 display server is running');
  } catch (e) {
    console.log('X11 check failed');
  }
  
  // Check for Electron
  console.log('\n## Electron Check');
  try {
    const electron = require('electron');
    console.log(`- Electron version: ${electron.app ? electron.app.getVersion() : 'not available'}`);
  } catch (e) {
    console.log(`- Electron not available: ${e.message}`);
  }
  
} catch (e) {
  console.error('Diagnostic error:', e);
}

console.log('=== End of Diagnostics ===\n');

// Write all output to log file
try {
    fs.writeFileSync(logFile, output.join('\n') + '\n', 'utf8');
    console.log(`\nDiagnostic log saved to: ${logFile}`);
} catch (e) {
    console.error(`\nFailed to write log file: ${e.message}`);
}

// Restore original console.log
console.log = originalConsoleLog;
