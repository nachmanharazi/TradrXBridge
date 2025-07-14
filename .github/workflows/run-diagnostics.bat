@echo off
echo Running Docker diagnostics...

echo Creating logs directory if it doesn't exist...
if not exist "logs" mkdir logs

echo Running diagnostics in container...
docker run --rm -v "%CD%\logs:/app/logs" electron-ai-app node -e "
  const fs = require('fs');
  const { execSync } = require('child_process');
  
  const output = [];
  const log = (msg) => {
    console.log(msg);
    output.push(msg);
  };
  
  log('=== Direct Diagnostic Run ===');
  log(`Node.js Version: ${process.version}`);
  log(`Platform: ${process.platform}`);
  log(`Architecture: ${process.arch}`);
  log(`Current directory: ${process.cwd()}`);
  log('\nEnvironment variables:');
  Object.keys(process.env).forEach(key => {
    log(`- ${key}=${process.env[key]}`);
  });
  
  log('\nDirectory contents:');
  try {
    const files = fs.readdirSync('.');
    log(files.join('\n'));
  } catch (e) {
    log(`Error reading directory: ${e.message}`);
  }
  
  // Try to run the diagnostic script directly
  try {
    log('\n=== Running docker-diagnostic.js ===');
    const diagnosticOutput = execSync('node docker-diagnostic.js', { stdio: 'pipe' }).toString();
    log(diagnosticOutput);
  } catch (e) {
    log(`Error running diagnostic script: ${e.message}`);
    log(`stdout: ${e.stdout ? e.stdout.toString() : 'none'}`);
    log(`stderr: ${e.stderr ? e.stderr.toString() : 'none'}`);
  }
  
  // Write output to file
  try {
    fs.writeFileSync('/app/logs/direct-diagnostic.log', output.join('\n'));
  } catch (e) {
    log(`Error writing log file: ${e.message}`);
  }
"

echo.
echo Diagnostics complete. Check the logs directory for output files.
