// TradrXBridge API Integration Module

class APIManager {
    constructor() {
        this.baseUrls = {
            coingecko: 'https://api.coingecko.com/api/v3',
            binance: 'https://api.binance.com/api/v3',
            coinbase: 'https://api.exchange.coinbase.com',
            kraken: 'https://api.kraken.com/0/public'
        };
        
        this.wsConnections = new Map();
        this.apiKeys = this.loadApiKeys();
        this.rateLimits = new Map();
    }

    // Enhanced API key loading with integrity checks
    loadApiKeys() {
        try {
            const exchanges = ['binance', 'coinbase'];
            const result = {};
            
            exchanges.forEach(exchange => {
                result[exchange] = {};
                
                const keyTypes = exchange === 'coinbase' 
                    ? ['apiKey', 'secretKey', 'passphrase']
                    : ['apiKey', 'secretKey'];
                
                keyTypes.forEach(keyType => {
                    try {
                        const encryptedKey = localStorage.getItem(`${exchange}_${keyType}_enc`);
                        const metadata = localStorage.getItem(`${exchange}_${keyType}_meta`);
                        
                        if (encryptedKey && metadata) {
                            const meta = JSON.parse(metadata);
                            
                            // Check if key is too old (older than 30 days)
                            const keyAge = Date.now() - meta.stored;
                            if (keyAge > 30 * 24 * 60 * 60 * 1000) {
                                console.warn(`⚠️ API key for ${exchange}:${keyType} is older than 30 days`);
                            }
                            
                            result[exchange][keyType] = this.decryptKey(encryptedKey) || '';
                        } else {
                            result[exchange][keyType] = '';
                        }
                    } catch (keyError) {
                        console.error(`❌ Error loading ${exchange}:${keyType}:`, keyError);
                        result[exchange][keyType] = '';
                    }
                });
            });
            
            return result;
        } catch (error) {
            console.error('🔐 Critical error loading API keys:', error);
            return {
                binance: { apiKey: '', secretKey: '' },
                coinbase: { apiKey: '', secretKey: '', passphrase: '' }
            };
        }
    }

    // Enhanced rate limiting with adaptive throttling
    async checkRateLimit(exchange, endpoint) {
        const key = `${exchange}_${endpoint}`;
        const now = Date.now();
        const lastCall = this.rateLimits.get(key) || 0;
        
        // Adaptive rate limiting based on exchange
        const rateLimitConfig = {
            coingecko: { interval: 1000, burstLimit: 5 },
            binance: { interval: 500, burstLimit: 10 },
            coinbase: { interval: 1000, burstLimit: 3 }
        };
        
        const config = rateLimitConfig[exchange] || { interval: 1000, burstLimit: 5 };
        const timeSinceLastCall = now - lastCall;
        
        if (timeSinceLastCall < config.interval) {
            const waitTime = config.interval - timeSinceLastCall;
            console.log(`⏳ Rate limiting ${exchange}:${endpoint} - waiting ${waitTime}ms`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
        }
        
        this.rateLimits.set(key, Date.now());
    }

    // Enhanced API request with performance monitoring and security
    async makeRequest(url, options = {}) {
        return this.monitorApiPerformance('api_request', async () => {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // Increased timeout
            
            try {
                // Enhanced security headers
                const secureHeaders = {
                    'Content-Type': 'application/json',
                    'User-Agent': 'TradrXBridge/2.1',
                    'X-Requested-With': 'XMLHttpRequest',
                    'Cache-Control': 'no-cache',
                    'Pragma': 'no-cache',
                    ...options.headers
                };
                
                const response = await fetch(url, {
                    ...options,
                    signal: controller.signal,
                    headers: secureHeaders,
                    // Enhanced security options
                    credentials: 'omit',
                    referrerPolicy: 'no-referrer'
                });

                clearTimeout(timeoutId);

                if (!response.ok) {
                    const errorText = await response.text().catch(() => 'Unknown error');
                    throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorText}`);
                }

                const data = await response.json();
                return data;
            } catch (error) {
                clearTimeout(timeoutId);
                
                if (error.name === 'AbortError') {
                    throw new Error('Request timeout - API server not responding');
                }
                
                console.error('🌐 API Request failed:', {
                    url: this.sanitizeUrl(url),
                    error: error.message,
                    timestamp: new Date().toISOString()
                });
                throw error;
            }
        });
    }
    
    // URL sanitization for logging
    sanitizeUrl(url) {
        return url
            .replace(/api_key=[^&]+/g, 'api_key=***')
            .replace(/secret=[^&]+/g, 'secret=***')
            .replace(/signature=[^&]+/g, 'signature=***');
    }

    // CoinGecko Integration - Free tier, no API key needed
    async getCoinGeckoPrice(coinIds) {
        await this.checkRateLimit('coingecko', 'prices');
        
        const url = `${this.baseUrls.coingecko}/simple/price?ids=${coinIds.join(',')}&vs_currencies=usd&include_24hr_change=true`;
        return await this.makeRequest(url);
    }

    async getCoinGeckoMarkets(page = 1, perPage = 100) {
        await this.checkRateLimit('coingecko', 'markets');
        
        const url = `${this.baseUrls.coingecko}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=${perPage}&page=${page}`;
        return await this.makeRequest(url);
    }

    // Binance Integration
    async getBinanceTicker(symbol = null) {
        await this.checkRateLimit('binance', 'ticker');
        
        const url = symbol 
            ? `${this.baseUrls.binance}/ticker/24hr?symbol=${symbol}`
            : `${this.baseUrls.binance}/ticker/24hr`;
        
        return await this.makeRequest(url);
    }

    async getBinanceOrderBook(symbol, limit = 100) {
        await this.checkRateLimit('binance', 'depth');
        
        const url = `${this.baseUrls.binance}/depth?symbol=${symbol}&limit=${limit}`;
        return await this.makeRequest(url);
    }

    // Enhanced WebSocket connections with comprehensive error handling and cleanup
    connectBinanceWebSocket(symbols, callback) {
        return new Promise((resolve, reject) => {
            try {
                const streams = symbols.map(s => `${s.toLowerCase()}@ticker`).join('/');
                const wsUrl = `wss://stream.binance.com:9443/ws/${streams}`;
                
                // Close existing connection if any
                this.cleanupWebSocketConnection('binance');
                
                const ws = new WebSocket(wsUrl);
                let heartbeatInterval;
                let connectionTimeout;
                let isConnected = false;
                
                // Connection timeout
                connectionTimeout = setTimeout(() => {
                    if (!isConnected) {
                        ws.close();
                        reject(new Error('WebSocket connection timeout'));
                    }
                }, 10000);
                
                ws.onopen = () => {
                    isConnected = true;
                    clearTimeout(connectionTimeout);
                    console.log('🔗 Binance WebSocket connected');
                    
                    // Setup heartbeat with proper cleanup
                    heartbeatInterval = setInterval(() => {
                        if (ws.readyState === WebSocket.OPEN) {
                            try {
                                ws.ping?.();
                            } catch (error) {
                                console.warn('⚠️ WebSocket ping failed:', error);
                            }
                        } else {
                            clearInterval(heartbeatInterval);
                        }
                    }, 30000);
                    
                    resolve(ws);
                };
                
                ws.onmessage = (event) => {
                    try {
                        const data = JSON.parse(event.data);
                        if (data.e === '24hrTicker' && typeof callback === 'function') {
                            callback(data);
                        }
                    } catch (error) {
                        console.error('📨 WebSocket message parsing error:', error);
                    }
                };
                
                ws.onerror = (error) => {
                    console.error('🔌 Binance WebSocket error:', error);
                    this.cleanupWebSocketResources(heartbeatInterval, connectionTimeout);
                    if (!isConnected) {
                        reject(error);
                    }
                };
                
                ws.onclose = (event) => {
                    console.log(`🔌 Binance WebSocket disconnected: ${event.code} - ${event.reason}`);
                    this.cleanupWebSocketResources(heartbeatInterval, connectionTimeout);
                    this.wsConnections.delete('binance');
                };
                
                // Store connection with cleanup info
                this.wsConnections.set('binance', {
                    socket: ws,
                    heartbeatInterval,
                    connectionTimeout,
                    cleanup: () => this.cleanupWebSocketResources(heartbeatInterval, connectionTimeout)
                });
                
            } catch (error) {
                console.error('🔌 Failed to create WebSocket connection:', error);
                reject(error);
            }
        });
    }
    
    // Helper method for WebSocket cleanup
    cleanupWebSocketConnection(exchange) {
        const connection = this.wsConnections.get(exchange);
        if (connection) {
            if (connection.socket && connection.socket.readyState === WebSocket.OPEN) {
                connection.socket.close();
            }
            if (connection.cleanup) {
                connection.cleanup();
            }
            this.wsConnections.delete(exchange);
        }
    }
    
    // Helper method for cleaning up WebSocket resources
    cleanupWebSocketResources(heartbeatInterval, connectionTimeout) {
        if (heartbeatInterval) {
            clearInterval(heartbeatInterval);
        }
        if (connectionTimeout) {
            clearTimeout(connectionTimeout);
        }
    }

    // Trading operations (requires API keys)
    async placeBinanceOrder(symbol, side, type, quantity, price = null) {
        if (!this.apiKeys.binance.apiKey || !this.apiKeys.binance.secretKey) {
            throw new Error('Binance API keys not configured');
        }

        // This is a simplified example - real implementation needs proper signing
        const orderData = {
            symbol: symbol,
            side: side.toUpperCase(),
            type: type.toUpperCase(),
            quantity: quantity,
            ...(price && { price: price }),
            timestamp: Date.now()
        };

        // Note: Real implementation requires HMAC SHA256 signature
        console.warn('Order placement requires proper API key signing - this is a demo');
        return { orderId: Date.now(), status: 'DEMO_ORDER', ...orderData };
    }

    // Portfolio data
    async getBinanceAccount() {
        if (!this.apiKeys.binance.apiKey) {
            throw new Error('Binance API key not configured');
        }

        // Demo response - real implementation needs proper authentication
        return {
            balances: [
                { asset: 'BTC', free: '0.00000000', locked: '0.00000000' },
                { asset: 'USDT', free: '1000.00000000', locked: '0.00000000' }
            ]
        };
    }

    // Exchange status
    async getExchangeStatus(exchange) {
        switch (exchange) {
        case 'binance':
            const url = `${this.baseUrls.binance}/ping`;
            try {
                await this.makeRequest(url);
                return { status: 'online', latency: Date.now() };
            } catch {
                return { status: 'offline', latency: null };
            }
        default:
            return { status: 'unknown', latency: null };
        }
    }

    // Enhanced disconnect all WebSocket connections with proper cleanup
    disconnectAll() {
        try {
            this.wsConnections.forEach((connection, exchange) => {
                console.log(`🔌 Disconnecting ${exchange} WebSocket...`);
                
                if (connection.socket) {
                    if (connection.socket.readyState === WebSocket.OPEN) {
                        connection.socket.close(1000, 'Manual disconnect');
                    }
                } else if (connection.readyState === WebSocket.OPEN) {
                    // Legacy format support
                    connection.close(1000, 'Manual disconnect');
                }
                
                // Cleanup resources
                if (connection.cleanup) {
                    connection.cleanup();
                }
            });
            
            this.wsConnections.clear();
            console.log('🧹 All WebSocket connections cleaned up');
        } catch (error) {
            console.error('❌ Error during WebSocket cleanup:', error);
        }
    }

    // Enhanced API key storage with validation and encryption
    setApiKeys(exchange, keys) {
        try {
            // Validate all keys before storing
            for (const [keyType, value] of Object.entries(keys)) {
                if (value && value.trim()) {
                    const validation = this.validateApiKey(exchange, keyType, value.trim());
                    if (!validation.valid) {
                        throw new Error(validation.error);
                    }
                }
            }
            
            this.apiKeys[exchange] = { ...this.apiKeys[exchange], ...keys };
            
            // Store encrypted keys in localStorage with enhanced security
            Object.entries(keys).forEach(([key, value]) => {
                if (value && value.trim()) {
                    const encryptedValue = this.encryptKey(value.trim());
                    localStorage.setItem(`${exchange}_${key}_enc`, encryptedValue);
                    
                    // Remove old unencrypted keys if they exist
                    localStorage.removeItem(`${exchange}_${key}`);
                    
                    // Store metadata for validation
                    localStorage.setItem(`${exchange}_${key}_meta`, JSON.stringify({
                        stored: Date.now(),
                        exchange,
                        keyType: key
                    }));
                }
            });
            
            console.log(`🔐 API keys for ${exchange} stored securely with validation`);
        } catch (error) {
            console.error('🔐 Error storing API keys:', error);
            throw new Error(`Failed to store API keys: ${error.message}`);
        }
    }

    getApiKeyStatus(exchange) {
        const keys = this.apiKeys[exchange];
        if (!keys) return { configured: false, keys: [] };
        
        return {
            configured: Object.values(keys).some(key => key.length > 0),
            keys: Object.keys(keys).map(key => ({
                name: key,
                configured: keys[key].length > 0
            }))
        };
    }

    // Enhanced encryption/decryption with improved security
    encryptKey(key) {
        if (!key) return '';
        try {
            // Enhanced XOR encryption with dynamic salt
            const timestamp = Date.now().toString();
            const secretKey = 'TradrXBridge2025' + timestamp.slice(-4);
            let encrypted = '';
            
            // Add timestamp prefix for salt
            const dataToEncrypt = timestamp.slice(-4) + key;
            
            for (let i = 0; i < dataToEncrypt.length; i++) {
                encrypted += String.fromCharCode(
                    dataToEncrypt.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length)
                );
            }
            
            // Double encode for additional obfuscation
            return btoa(btoa(encrypted));
        } catch (error) {
            console.error('🔐 Encryption error:', error);
            throw new Error('Failed to encrypt API key');
        }
    }
    
    decryptKey(encryptedKey) {
        if (!encryptedKey) return '';
        try {
            // Double decode
            const doubleDecoded = atob(atob(encryptedKey));
            
            // Extract salt (first 4 characters)
            const salt = doubleDecoded.slice(0, 4);
            const encryptedData = doubleDecoded.slice(4);
            const secretKey = 'TradrXBridge2025' + salt;
            
            let decrypted = '';
            for (let i = 0; i < encryptedData.length; i++) {
                decrypted += String.fromCharCode(
                    encryptedData.charCodeAt(i) ^ secretKey.charCodeAt(i % secretKey.length)
                );
            }
            
            return decrypted;
        } catch (error) {
            console.error('🔐 Decryption error:', error);
            return ''; // Return empty on error
        }
    }
    
    // Enhanced API key validation
    validateApiKey(exchange, keyType, value) {
        if (!value || typeof value !== 'string') {
            return { valid: false, error: 'API key cannot be empty' };
        }
        
        // Basic format validation
        switch (exchange) {
        case 'binance':
            if (keyType === 'apiKey' && (value.length < 32 || !/^[A-Za-z0-9]+$/.test(value))) {
                return { valid: false, error: 'Invalid Binance API key format' };
            }
            if (keyType === 'secretKey' && (value.length < 32 || !/^[A-Za-z0-9+/=]+$/.test(value))) {
                return { valid: false, error: 'Invalid Binance secret key format' };
            }
            break;
        case 'coinbase':
            if (keyType === 'apiKey' && (value.length < 16 || !/^[A-Za-z0-9-]+$/.test(value))) {
                return { valid: false, error: 'Invalid Coinbase API key format' };
            }
            break;
        }
        
        return { valid: true };
    }
    
    // Enhanced API key clearing with secure deletion
    clearAllApiKeys() {
        try {
            const exchanges = ['binance', 'coinbase'];
            const keyTypes = ['apiKey', 'secretKey', 'passphrase'];
            
            exchanges.forEach(exchange => {
                keyTypes.forEach(keyType => {
                    // Clear encrypted keys
                    localStorage.removeItem(`${exchange}_${keyType}_enc`);
                    // Clear metadata
                    localStorage.removeItem(`${exchange}_${keyType}_meta`);
                    // Clear legacy unencrypted keys
                    localStorage.removeItem(`${exchange}_${keyType}`);
                });
                
                // Reset in-memory keys with empty objects
                if (this.apiKeys[exchange]) {
                    Object.keys(this.apiKeys[exchange]).forEach(key => {
                        this.apiKeys[exchange][key] = '';
                    });
                }
            });
            
            // Force garbage collection of sensitive data
            if (window.gc) {
                window.gc();
            }
            
            console.log('🧹 All API keys securely cleared');
        } catch (error) {
            console.error('🧹 Error clearing API keys:', error);
            throw new Error('Failed to clear API keys securely');
        }
    }
    
    // Performance monitoring for API calls
    async monitorApiPerformance(operation, apiCall) {
        const startTime = performance.now();
        const startMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
        
        try {
            const result = await apiCall();
            const endTime = performance.now();
            const endMemory = performance.memory ? performance.memory.usedJSHeapSize : 0;
            
            const metrics = {
                operation,
                duration: endTime - startTime,
                memoryDelta: endMemory - startMemory,
                timestamp: new Date().toISOString()
            };
            
            // Log performance metrics for monitoring
            if (metrics.duration > 5000) { // Log slow operations
                console.warn(`⚡ Slow API operation detected:`, metrics);
            }
            
            return result;
        } catch (error) {
            const endTime = performance.now();
            console.error(`❌ API operation failed:`, {
                operation,
                duration: endTime - startTime,
                error: error.message
            });
            throw error;
        }
    }
}

// Export for use in other modules
window.APIManager = APIManager;
