// Simple test script to verify basic Node.js and file system access
const fs = require('fs');
const path = require('path');

// Create a test file
const testFile = path.join(__dirname, 'direct-test-output.txt');
const content = `Test successful at: ${new Date().toISOString()}
Node.js version: ${process.version}
Platform: ${process.platform}
Architecture: ${process.arch}
`;

try {
  fs.writeFileSync(testFile, content);
  console.log('Test file created successfully at:', testFile);
  console.log('File content:', content);
} catch (error) {
  console.error('Error creating test file:', error);
}
