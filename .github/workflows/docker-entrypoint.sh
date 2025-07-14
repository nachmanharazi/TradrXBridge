#!/bin/sh
set -e

# Function to run diagnostics
run_diagnostics() {
    echo "=== Running Diagnostics ==="
    echo "Node.js version: $(node -v)"
    echo "NPM version: $(npm -v || echo 'N/A')"
    echo "Current directory: $(pwd)"
    echo "Environment variables:"
    env | sort
    
    echo -e "\n=== Directory Structure ==="
    ls -la /app
    
    echo -e "\n=== Running Node.js Diagnostics ==="
    node /app/docker-diagnostic.js
    
    echo -e "\n=== Checking Xvfb ==="
    if pgrep -x "Xvfb" > /dev/null; then
        echo "Xvfb is running"
    else
        echo "Xvfb is NOT running"
    fi
    
    echo -e "\n=== Checking Display ==="
    xdpyinfo -display :99 || echo "Display :99 not available"
    
    echo -e "\n=== Process List ==="
    ps aux
    
    echo -e "\n=== Network Connections ==="
    netstat -tuln
    
    echo -e "\n=== Disk Usage ==="
    df -h
    
    echo -e "\n=== Memory Usage ==="
    free -m
}

# Function to start Xvfb
start_xvfb() {
    echo "Starting Xvfb on display ${DISPLAY}"
    Xvfb ${DISPLAY} -screen 0 1024x768x24 -ac +extension GLX +render -noreset > /var/log/xvfb.log 2>&1 &
    export DISPLAY=${DISPLAY}
    sleep 2
    
    # Verify Xvfb is running
    if ! pgrep -x "Xvfb" > /dev/null; then
        echo "ERROR: Failed to start Xvfb"
        cat /var/log/xvfb.log || true
        return 1
    fi
    
    echo "Xvfb started successfully"
    return 0
}

# Function to start the application
start_application() {
    echo "Starting application..."
    cd /app
    
    # Start the application
    echo "Running: node oneclick.js run"
    exec node oneclick.js run
}

# Main script
case "$1" in
    start-app)
        start_xvfb
        start_application
        ;;
    diagnostics)
        run_diagnostics
        ;;
    shell)
        /bin/sh
        ;;
    *)
        echo "Usage: $0 {start-app|diagnostics|shell}"
        exit 1
        ;;
esac

# Keep container running if requested
if [ "$KEEP_RUNNING" = "true" ]; then
    tail -f /dev/null
fi
