# Use Node.js LTS image with Alpine for smaller size
FROM node:20-alpine

# Install system dependencies
RUN apk add --no-cache \
    xvfb \
    # Required for Electron
    libx11 \
    libxcb \
    libxcomposite \
    libxdamage \
    libxext \
    libxfixes \
    libxrandr \
    libxrender \
    libxss \
    libxtst \
    alsa-lib \
    at-spi2-atk \
    at-spi2-core \
    atk \
    cairo \
    cups-libs \
    dbus \
    dbus-x11 \
    eudev-libs \
    expat \
    gtk+3.0 \
    libxkbcommon \
    nss \
    pango \
    tzdata \
    xdg-utils \
    # Build tools for native modules
    python3 \
    make \
    g++ \
    # For git and other utilities
    git \
    openssh-client \
    # For X11 debugging
    xdpyinfo \
    xrandr \
    # For process management
    procps \
    # For network debugging
    iputils \
    net-tools

# Set environment variables
ENV NODE_ENV=production \
    DISPLAY=:99 \
    ELECTRON_DISABLE_SANDBOX=true \
    ELECTRON_EXTRA_LAUNCH_ARGS=--no-sandbox \
    ELECTRON_FORCE_WINDOW_MENU_BAR=true \
    NODE_OPTIONS=--max_old_space_size=2048 \
    TZ=Asia/Jerusalem \
    # Required for Xvfb
    DISPLAY=:99 \
    # Required for GUI applications
    QT_X11_NO_MITSHM=1 \
    _X11_NO_MITSHM=1 \
    _MITSHM=0 \
    # Additional Electron flags
    ELECTRON_FORCE_IS_PACKAGED=true \
    ELECTRON_NO_ATTACH_CONSOLE=true \
    # Debug flags
    DEBUG=electron*,xvfb

# Create app directory
WORKDIR /app

# Install app dependencies first for better caching
COPY package*.json ./

# Install dependencies (including devDependencies for Electron)
RUN npm install --include=dev

# Copy application code
COPY . .

# Create necessary files if they don't exist
RUN touch remote-password.txt memory.json

# Make scripts executable and create logs directory
RUN chmod +x oneclick.js docker-diagnostic.js && \
    mkdir -p /app/logs && \
    chmod 777 /app/logs

# Expose necessary ports
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s \
            --timeout=10s \
            --start-period=30s \
            --retries=3 \
            CMD node healthcheck.js || exit 1

# Diagnostic entrypoint
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh
ENTRYPOINT ["/usr/local/bin/docker-entrypoint.sh"]

# Default command (can be overridden)
CMD ["start-app"]
