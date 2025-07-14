const fs = require('fs');
const path = require('path');

// Create a simple test file
const testFile = path.join(__dirname, 'test-output.txt');
const testContent = `Test successful at ${new Date().toISOString()}
Node.js Version: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}
Current directory: ${process.cwd()}
`;

// Write test file
fs.writeFileSync(testFile, testContent);
console.log('Test file created successfully at:', testFile);

// Also log to console
console.log('Test script completed successfully!');
