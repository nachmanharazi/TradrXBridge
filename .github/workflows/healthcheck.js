const http = require('http');
const { exec } = require('child_process');

// Simple HTTP server for health checks
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    // Check if Xvfb is running
    exec('pgrep Xvfb', (error) => {
      if (error) {
        console.error('Xvfb is not running');
        res.writeHead(500);
        return res.end('Xvfb not running');
      }
      
      // Check if the main process is running
      exec('pgrep -f "node oneclick.js"', (error) => {
        if (error) {
          console.error('Main process is not running');
          res.writeHead(500);
          return res.end('Main process not running');
        }
        
        res.writeHead(200);
        res.end('OK');
      });
    });
  } else {
    res.writeHead(404);
    res.end();
  }
});

// Start the health check server
const PORT = process.env.HEALTH_CHECK_PORT || 8080;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Health check server running on port ${PORT}`);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
