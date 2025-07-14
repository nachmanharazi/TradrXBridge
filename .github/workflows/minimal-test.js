// Minimal test script to verify Docker can run Node.js
const fs = require('fs');

// This will create a file in the current directory
fs.writeFileSync('minimal-test-output.txt', 'Hello from Docker! ' + new Date().toISOString());

// This will be visible in the Docker logs
console.log('Minimal test script completed successfully!');
