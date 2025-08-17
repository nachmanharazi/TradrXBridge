// TradrXBridge Integration Manager

class IntegrationManager {
    constructor() {
        this.apiManager = new APIManager();
        this.activeIntegrations = new Set();
        this.priceUpdateInterval = null;
        this.wsReconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectTimeout = null;
        this.isDestroyed = false;
        
        this.coinMapping = {
            'BTC/USDT': { coingecko: 'bitcoin', binance: 'BTCUSDT' },
            'ETH/USDT': { coingecko: 'ethereum', binance: 'ETHUSDT' },
            'BNB/USDT': { coingecko: 'binancecoin', binance: 'BNBUSDT' },
            'ADA/USDT': { coingecko: 'cardano', binance: 'ADAUSDT' },
            'SOL/USDT': { coingecko: 'solana', binance: 'SOLUSDT' },
            'XRP/USDT': { coingecko: 'ripple', binance: 'XRPUSDT' }
        };
    }

    // Initialize all integrations
    async initialize() {
        try {
            await this.setupPriceFeeds();
            await this.checkExchangeConnections();
            this.setupEventListeners();
            
            console.log('Integration Manager initialized successfully');
            return true;
        } catch (error) {
            console.error('Integration initialization failed:', error);
            return false;
        }
    }

    // Setup real-time price feeds
    async setupPriceFeeds() {
        // Start with CoinGecko for initial data (free tier)
        await this.updatePricesFromCoinGecko();
        
        // Setup periodic updates
        this.priceUpdateInterval = setInterval(() => {
            this.updatePricesFromCoinGecko();
        }, 30000); // Update every 30 seconds

        // Try to setup WebSocket for real-time data
        this.setupWebSocketFeeds();
    }

    async updatePricesFromCoinGecko() {
        try {
            const coinIds = Object.values(this.coinMapping).map(coin => coin.coingecko);
            const priceData = await this.apiManager.getCoinGeckoPrice(coinIds);
            
            // Update the trading pairs with real data
            Object.entries(this.coinMapping).forEach(([pair, mapping]) => {
                const coinData = priceData[mapping.coingecko];
                if (coinData) {
                    this.updateTradingPairPrice(pair, {
                        price: parseFloat(coinData.usd) || 0,
                        change: parseFloat(coinData.usd_24h_change) || 0
                    });
                }
            });

            this.activeIntegrations.add('coingecko');
        } catch (error) {
            console.error('CoinGecko price update failed:', error);
            this.activeIntegrations.delete('coingecko');
        }
    }

    async setupWebSocketFeeds() {
        if (this.isDestroyed) return;
        
        try {
            const symbols = Object.values(this.coinMapping).map(coin => coin.binance);
            
            // Use the enhanced WebSocket connection with Promise support
            await this.apiManager.connectBinanceWebSocket(symbols, (data) => {
                if (!this.isDestroyed) {
                    this.handleWebSocketPriceUpdate(data);
                }
            });

            this.activeIntegrations.add('binance_ws');
            this.wsReconnectAttempts = 0;
            console.log('✅ WebSocket feeds established successfully');
        } catch (error) {
            console.error('❌ WebSocket setup failed:', error);
            this.activeIntegrations.delete('binance_ws');
            this.handleWebSocketReconnect();
        }
    }

    handleWebSocketPriceUpdate(data) {
        try {
            // Find the corresponding trading pair
            const binanceSymbol = data.s;
            const pair = Object.keys(this.coinMapping).find(
                key => this.coinMapping[key].binance === binanceSymbol
            );

            if (pair) {
                this.updateTradingPairPrice(pair, {
                    price: parseFloat(data.c), // Current price
                    change: parseFloat(data.P)  // 24h change percentage
                });
            }
        } catch (error) {
            console.error('WebSocket data processing error:', error);
        }
    }

    handleWebSocketReconnect() {
        if (this.isDestroyed || this.wsReconnectAttempts >= this.maxReconnectAttempts) {
            if (this.wsReconnectAttempts >= this.maxReconnectAttempts) {
                console.warn('⚠️ Max WebSocket reconnect attempts reached');
                this.activeIntegrations.delete('binance_ws');
                this.notifyConnectionFailure();
            }
            return;
        }

        this.wsReconnectAttempts++;
        const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000); // Exponential backoff, max 30s
        
        console.log(`🔄 WebSocket reconnect attempt ${this.wsReconnectAttempts}/${this.maxReconnectAttempts} in ${delay/1000}s`);
        
        // Clear any existing timeout
        if (this.reconnectTimeout) {
            clearTimeout(this.reconnectTimeout);
        }
        
        this.reconnectTimeout = setTimeout(async () => {
            if (!this.isDestroyed && this.wsReconnectAttempts <= this.maxReconnectAttempts) {
                await this.setupWebSocketFeeds();
            }
        }, delay);
    }

    notifyConnectionFailure() {
        if (window.tradingBridge) {
            window.tradingBridge.showNotification(
                'WebSocket connection failed after multiple attempts', 
                'error'
            );
        }
    }

    updateTradingPairPrice(pair, priceData) {
        // Update the trading bridge instance
        if (window.tradingBridge && window.tradingBridge.tradingPairs) {
            const pairData = window.tradingBridge.tradingPairs.get(pair);
            if (pairData) {
                pairData.price = priceData.price;
                pairData.change = priceData.change;
                
                // Trigger UI update
                window.tradingBridge.renderTradingPairs();
            }
        }
    }

    // Exchange connection testing
    async checkExchangeConnections() {
        const exchanges = ['binance'];
        const connectionResults = {};

        for (const exchange of exchanges) {
            try {
                const status = await this.apiManager.getExchangeStatus(exchange);
                connectionResults[exchange] = status;
                
                if (status.status === 'online') {
                    this.activeIntegrations.add(exchange);
                }
            } catch (error) {
                connectionResults[exchange] = { status: 'error', error: error.message };
            }
        }

        return connectionResults;
    }

    // Trading integration
    async executeTrade(tradeData) {
        try {
            // Validate API keys are configured
            const apiStatus = this.apiManager.getApiKeyStatus('binance');
            if (!apiStatus.configured) {
                throw new Error('Trading API keys not configured. Please set up your exchange API keys.');
            }

            // Map trading pair to exchange format
            const mapping = this.coinMapping[tradeData.pair];
            if (!mapping) {
                throw new Error(`Unsupported trading pair: ${tradeData.pair}`);
            }

            // Execute trade on Binance (demo mode)
            const result = await this.apiManager.placeBinanceOrder(
                mapping.binance,
                tradeData.type,
                'MARKET', // or 'LIMIT' based on user preference
                tradeData.amount,
                tradeData.price
            );

            return {
                success: true,
                orderId: result.orderId,
                status: result.status,
                exchange: 'binance'
            };

        } catch (error) {
            console.error('Trade execution failed:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    // Portfolio integration
    async getPortfolioData() {
        try {
            const binanceAccount = await this.apiManager.getBinanceAccount();
            
            // Process and format portfolio data
            const portfolio = {
                totalBalance: 0,
                positions: [],
                lastUpdated: new Date()
            };

            binanceAccount.balances.forEach(balance => {
                const free = parseFloat(balance.free);
                const locked = parseFloat(balance.locked);
                const total = free + locked;

                if (total > 0) {
                    portfolio.positions.push({
                        asset: balance.asset,
                        free: free,
                        locked: locked,
                        total: total
                    });
                }
            });

            return portfolio;
        } catch (error) {
            console.error('Portfolio data fetch failed:', error);
            return null;
        }
    }

    // API Key management
    configureApiKeys(exchange, keys) {
        try {
            this.apiManager.setApiKeys(exchange, keys);
            
            // Test the connection
            this.checkExchangeConnections().then(results => {
                const status = results[exchange];
                if (status && status.status === 'online') {
                    window.tradingBridge?.showNotification(
                        `${exchange} API keys configured successfully!`, 
                        'success'
                    );
                } else {
                    window.tradingBridge?.showNotification(
                        `${exchange} API configuration failed. Please check your keys.`, 
                        'error'
                    );
                }
            });

        } catch (error) {
            console.error('API key configuration failed:', error);
            window.tradingBridge?.showNotification(
                'API key configuration failed', 
                'error'
            );
        }
    }

    // Integration status
    getIntegrationStatus() {
        return {
            active: Array.from(this.activeIntegrations),
            priceFeeds: this.priceUpdateInterval !== null,
            webSocket: this.activeIntegrations.has('binance_ws'),
            apiKeys: {
                binance: this.apiManager.getApiKeyStatus('binance'),
                coinbase: this.apiManager.getApiKeyStatus('coinbase')
            }
        };
    }

    // Event listeners for integration events
    setupEventListeners() {
        // Bind event handlers to maintain 'this' context
        this.handleApiKeyConfig = (event) => {
            const { exchange, keys } = event.detail;
            this.configureApiKeys(exchange, keys);
        };
        
        this.handleTradeExecution = async (event) => {
            const tradeData = event.detail;
            const result = await this.executeTrade(tradeData);
            
            // Dispatch result event
            document.dispatchEvent(new CustomEvent('tradeResult', {
                detail: result
            }));
        };
        
        // Listen for API key configuration events
        document.addEventListener('configureApiKeys', this.handleApiKeyConfig);

        // Listen for trade execution events
        document.addEventListener('executeTrade', this.handleTradeExecution);
    }

    // Enhanced cleanup with proper error handling and state management
    destroy() {
        if (this.isDestroyed) {
            console.warn('⚠️ Integration Manager already destroyed');
            return;
        }
        
        this.isDestroyed = true;
        
        try {
            // Clear intervals
            if (this.priceUpdateInterval) {
                clearInterval(this.priceUpdateInterval);
                this.priceUpdateInterval = null;
            }
            
            // Clear reconnection timeouts
            if (this.reconnectTimeout) {
                clearTimeout(this.reconnectTimeout);
                this.reconnectTimeout = null;
            }
            
            // Disconnect API connections with enhanced cleanup
            if (this.apiManager) {
                this.apiManager.disconnectAll();
            }
            
            // Clear active integrations
            this.activeIntegrations.clear();
            
            // Remove event listeners with proper cleanup
            if (this.handleApiKeyConfig) {
                document.removeEventListener('configureApiKeys', this.handleApiKeyConfig);
            }
            if (this.handleTradeExecution) {
                document.removeEventListener('executeTrade', this.handleTradeExecution);
            }
            
            // Reset reconnection state
            this.wsReconnectAttempts = 0;
            
            console.log('🧹 Integration Manager cleaned up successfully');
        } catch (error) {
            console.error('❌ Error during Integration Manager cleanup:', error);
        }
    }
}

// Enhanced initialization with proper error handling and cleanup
class IntegrationManagerSingleton {
    constructor() {
        this.instance = null;
        this.isInitializing = false;
        this.initPromise = null;
    }

    async getInstance() {
        if (this.instance) {
            return this.instance;
        }

        if (this.isInitializing) {
            return this.initPromise;
        }

        this.isInitializing = true;
        this.initPromise = this.createInstance();
        
        try {
            this.instance = await this.initPromise;
            return this.instance;
        } finally {
            this.isInitializing = false;
        }
    }

    async createInstance() {
        try {
            const manager = new IntegrationManager();
            const success = await manager.initialize();
            
            if (success) {
                console.log('✅ Integration Manager initialized successfully');
                
                // Setup cleanup on page unload
                window.addEventListener('beforeunload', () => {
                    if (this.instance) {
                        this.instance.destroy();
                    }
                });
                
                // Notify other components with delay to ensure they're ready
                setTimeout(() => {
                    document.dispatchEvent(new CustomEvent('integrationManagerReady', {
                        detail: { manager }
                    }));
                }, 100);
                
                return manager;
            } else {
                throw new Error('Integration Manager initialization failed');
            }
        } catch (error) {
            console.error('❌ Critical error initializing Integration Manager:', error);
            throw error;
        }
    }

    destroy() {
        if (this.instance) {
            this.instance.destroy();
            this.instance = null;
        }
    }
}

// Create singleton instance
const integrationManagerSingleton = new IntegrationManagerSingleton();

// Enhanced initialization function
const initializeIntegrationManager = async () => {
    try {
        const manager = await integrationManagerSingleton.getInstance();
        window.integrationManager = manager;
        return manager;
    } catch (error) {
        console.error('❌ Failed to initialize Integration Manager:', error);
        return null;
    }
};

// Smart initialization based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeIntegrationManager, { once: true });
} else {
    // DOM already loaded, initialize immediately
    setTimeout(initializeIntegrationManager, 0);
}

// Export for global access
window.IntegrationManager = IntegrationManager;
window.initializeIntegrationManager = initializeIntegrationManager;
