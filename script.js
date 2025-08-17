// TradrXBridge - Trading Platform JavaScript

class TradrXBridge {
    constructor() {
        this.isConnected = false;
        this.tradingPairs = new Map();
        this.activeOrders = [];
        this.portfolio = {
            balance: 25000, // Starting balance
            positions: []
        };
        this.pendingTradeResult = null;
        this.statusUpdateInterval = null;
        this.tradeResultHandler = null;
        
        this.init();
    }

    init() {
        try {
            this.setupEventListeners();
            this.simulateConnection();
            this.loadTradingPairs();
            
            // Enhanced integration manager listener with error handling
            this.integrationReadyHandler = (event) => {
                try {
                    console.log('📡 Integration Manager ready, setting up listeners');
                    this.setupIntegrationListeners();
                } catch (error) {
                    console.error('❌ Error setting up integration listeners:', error);
                }
            };
            
            document.addEventListener('integrationManagerReady', this.integrationReadyHandler, { once: true });
            
            // Check if integration manager is already available with delay
            setTimeout(() => {
                if (window.integrationManager && !this.statusUpdateInterval) {
                    this.setupIntegrationListeners();
                }
            }, 500);
            
        } catch (error) {
            console.error('❌ Error during TradrXBridge initialization:', error);
        }
    }

    setupEventListeners() {
        // Bridge connection controls
        const connectBtn = document.getElementById('connect-bridge');
        const disconnectBtn = document.getElementById('disconnect-bridge');
        
        if (connectBtn) {
            connectBtn.addEventListener('click', () => this.connectBridge());
        }
        
        if (disconnectBtn) {
            disconnectBtn.addEventListener('click', () => this.disconnectBridge());
        }

        // Trading form submission
        const tradingForm = document.getElementById('trading-form');
        if (tradingForm) {
            tradingForm.addEventListener('submit', (e) => this.handleTrade(e));
        }

        // Portfolio refresh
        const refreshBtn = document.getElementById('refresh-portfolio');
        if (refreshBtn) {
            refreshBtn.addEventListener('click', () => this.refreshPortfolio());
        }

        // API key configuration
        const saveBinanceBtn = document.getElementById('save-binance-keys');
        if (saveBinanceBtn) {
            saveBinanceBtn.addEventListener('click', () => this.saveBinanceApiKeys());
        }
        
        // Security actions
        const clearKeysBtn = document.getElementById('clear-all-keys');
        if (clearKeysBtn) {
            clearKeysBtn.addEventListener('click', () => this.clearAllApiKeys());
        }
        
        const exportBtn = document.getElementById('export-settings');
        if (exportBtn) {
            exportBtn.addEventListener('click', () => this.exportSettings());
        }
        
        const importBtn = document.getElementById('import-settings');
        const fileInput = document.getElementById('settings-file');
        if (importBtn && fileInput) {
            importBtn.addEventListener('click', () => fileInput.click());
            fileInput.addEventListener('change', (e) => this.importSettings(e));
        }
    }

    async connectBridge() {
        const statusIndicator = document.querySelector('.status-indicator span');
        const statusDot = document.querySelector('.status-dot');
        
        if (statusIndicator) {
            statusIndicator.textContent = 'Connecting...';
        }
        
        // Simulate connection process
        await this.delay(2000);
        
        this.isConnected = true;
        
        if (statusIndicator) {
            statusIndicator.textContent = 'Connected';
        }
        
        if (statusDot) {
            statusDot.style.background = 'var(--secondary-color)';
        }
        
        this.showNotification('Bridge connected successfully!', 'success');
        this.updateConnectionButtons();
    }

    async disconnectBridge() {
        const statusIndicator = document.querySelector('.status-indicator span');
        const statusDot = document.querySelector('.status-dot');
        
        this.isConnected = false;
        
        if (statusIndicator) {
            statusIndicator.textContent = 'Disconnected';
        }
        
        if (statusDot) {
            statusDot.style.background = 'var(--danger-color)';
        }
        
        this.showNotification('Bridge disconnected', 'warning');
        this.updateConnectionButtons();
    }

    updateConnectionButtons() {
        const connectBtn = document.getElementById('connect-bridge');
        const disconnectBtn = document.getElementById('disconnect-bridge');
        
        if (connectBtn && disconnectBtn) {
            connectBtn.style.display = this.isConnected ? 'none' : 'block';
            disconnectBtn.style.display = this.isConnected ? 'block' : 'none';
        }
    }

    simulateConnection() {
        // Simulate initial connection status
        setTimeout(() => {
            if (!this.isConnected) {
                const statusIndicator = document.querySelector('.status-indicator span');
                const statusDot = document.querySelector('.status-dot');
                
                if (statusIndicator) {
                    statusIndicator.textContent = 'Ready to Connect';
                }
                
                if (statusDot) {
                    statusDot.style.background = 'var(--warning-color)';
                }
            }
        }, 1000);
    }

    loadTradingPairs() {
        // Simulate loading popular trading pairs
        const pairs = [
            { symbol: 'BTC/USDT', price: 43250.00, change: 2.45 },
            { symbol: 'ETH/USDT', price: 2680.50, change: -1.23 },
            { symbol: 'BNB/USDT', price: 315.80, change: 0.87 },
            { symbol: 'ADA/USDT', price: 0.485, change: 3.21 },
            { symbol: 'SOL/USDT', price: 98.75, change: -0.56 },
            { symbol: 'XRP/USDT', price: 0.625, change: 1.89 }
        ];

        pairs.forEach(pair => {
            this.tradingPairs.set(pair.symbol, pair);
        });

        this.renderTradingPairs();
    }

    renderTradingPairs() {
        const container = document.getElementById('trading-pairs');
        if (!container) return;

        container.innerHTML = '';

        this.tradingPairs.forEach((pair, symbol) => {
            const card = document.createElement('div');
            card.className = 'trading-card';
            
            const changeClass = pair.change >= 0 ? 'change-positive' : 'change-negative';
            const changeIcon = pair.change >= 0 ? '↗' : '↘';
            
            card.innerHTML = `
                <div class="card-header">
                    <h3 class="card-title">${symbol}</h3>
                </div>
                <div class="price-display">$${pair.price.toLocaleString()}</div>
                <div class="price-change ${changeClass}">
                    <span>${changeIcon}</span>
                    <span>${Math.abs(pair.change)}%</span>
                </div>
                <button class="control-button mt-2" onclick="tradingBridge.selectPair('${symbol}')">
                    Trade ${symbol.split('/')[0]}
                </button>
            `;
            
            container.appendChild(card);
        });
    }

    selectPair(symbol) {
        const pairSelect = document.getElementById('trading-pair');
        if (pairSelect) {
            pairSelect.value = symbol;
        }
        
        // Scroll to trading form
        const tradingSection = document.getElementById('trading-controls');
        if (tradingSection) {
            tradingSection.scrollIntoView({ behavior: 'smooth' });
        }
        
        this.showNotification(`Selected ${symbol} for trading`, 'info');
    }

    async handleTrade(event) {
        event.preventDefault();
        
        if (!this.isConnected) {
            this.showNotification('Please connect the bridge first', 'error');
            return;
        }

        const formData = new FormData(event.target);
        const tradeData = {
            pair: formData.get('pair'),
            type: formData.get('type'),
            amount: parseFloat(formData.get('amount')),
            price: parseFloat(formData.get('price'))
        };

        // Enhanced validation
        const validationErrors = this.validateTradeData(tradeData);
        if (validationErrors.length > 0) {
            this.showNotification(validationErrors[0], 'error');
            return;
        }

        // Use real integration if available
        if (window.integrationManager) {
            this.executeRealTrade(tradeData, event.target);
        } else {
            this.executeSimulatedTrade(tradeData, event.target);
        }
    }

    async executeRealTrade(tradeData, form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<span class="loading"></span> Processing...';
        submitBtn.disabled = true;

        try {
            // Enhanced validation
            if (!window.integrationManager) {
                throw new Error('Integration manager not available. Please refresh the page.');
            }
            
            // Validate trade data before execution
            const validationErrors = this.validateTradeData(tradeData);
            if (validationErrors.length > 0) {
                throw new Error(validationErrors[0]);
            }
            
            // Clear any pending results
            this.pendingTradeResult = null;
            
            // Dispatch trade execution event to integration manager
            document.dispatchEvent(new CustomEvent('executeTrade', {
                detail: tradeData
            }));
            
            // Wait for trade result with enhanced timeout handling
            const result = await this.waitForTradeResult(10000); // Increased timeout
            
            if (result && result.success) {
                form.reset();
                this.showNotification(`🎉 Trade executed successfully! Order ID: ${result.orderId}`, 'success');
                
                // Update portfolio after successful trade
                setTimeout(() => {
                    this.refreshPortfolio();
                }, 1000);
            } else {
                throw new Error(result?.error || 'Trade execution failed - no response received');
            }
            
        } catch (error) {
            console.error('💸 Real trade execution error:', error);
            this.showNotification(`❌ Trade failed: ${error.message}`, 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    async executeSimulatedTrade(tradeData, form) {
        const submitBtn = form.querySelector('button[type="submit"]');
        const originalText = submitBtn.textContent;
        
        submitBtn.innerHTML = '<span class="loading"></span> Processing...';
        submitBtn.disabled = true;

        try {
            await this.delay(2000); // Simulate API call
            
            // Add to active orders
            const order = {
                id: Date.now(),
                ...tradeData,
                status: 'filled',
                timestamp: new Date()
            };
            
            this.activeOrders.push(order);
            this.updatePortfolio(order);
            
            this.showNotification(`${tradeData.type.toUpperCase()} order executed successfully! (Simulated)`, 'success');
            form.reset();
            
        } catch (error) {
            console.error('Simulated trade execution error:', error);
            this.showNotification('Trade execution failed. Please try again.', 'error');
        } finally {
            submitBtn.textContent = originalText;
            submitBtn.disabled = false;
        }
    }

    validateTradeData(tradeData) {
        const errors = [];
        
        if (!tradeData.pair) {
            errors.push('Please select a trading pair');
        }
        
        if (!tradeData.amount || tradeData.amount <= 0) {
            errors.push('Please enter a valid amount greater than 0');
        }
        
        if (!tradeData.price || tradeData.price <= 0) {
            errors.push('Please enter a valid price greater than 0');
        }
        
        if (tradeData.amount && tradeData.amount > 1000000) {
            errors.push('Amount too large. Maximum allowed is 1,000,000');
        }
        
        if (tradeData.price && tradeData.price > 10000000) {
            errors.push('Price too high. Maximum allowed is 10,000,000');
        }
        
        return errors;
    }

    updatePortfolio(order) {
        // Update portfolio balance and positions
        const balanceElement = document.getElementById('portfolio-balance');
        const positionsElement = document.getElementById('portfolio-positions');
        
        if (order.type === 'buy') {
            this.portfolio.balance -= order.amount * order.price;
        } else {
            this.portfolio.balance += order.amount * order.price;
        }
        
        if (balanceElement) {
            balanceElement.textContent = `$${this.portfolio.balance.toLocaleString()}`;
        }
        
        // Update positions display
        this.renderPortfolio();
    }

    renderPortfolio() {
        const container = document.getElementById('recent-orders');
        if (!container) return;

        container.innerHTML = '';

        if (this.activeOrders.length === 0) {
            container.innerHTML = '<p class="text-center">No recent orders</p>';
            return;
        }

        this.activeOrders.slice(-5).reverse().forEach(order => {
            const orderElement = document.createElement('div');
            orderElement.className = 'order-item';
            orderElement.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; padding: 1rem; border-bottom: 1px solid var(--border-color);">
                    <div>
                        <strong>${order.pair}</strong> - ${order.type.toUpperCase()}
                        <br>
                        <small>${order.timestamp.toLocaleString()}</small>
                    </div>
                    <div style="text-align: right;">
                        <div>${order.amount} @ $${order.price}</div>
                        <div class="change-positive">${order.status.toUpperCase()}</div>
                    </div>
                </div>
            `;
            container.appendChild(orderElement);
        });
    }

    setupIntegrationListeners() {
        // Store bound event handlers for cleanup
        this.tradeResultHandler = (event) => {
            const result = event.detail;
            this.pendingTradeResult = result;
            
            if (result.success) {
                this.refreshPortfolio();
            }
        };
        
        // Listen for real trade execution results
        document.addEventListener('tradeResult', this.tradeResultHandler);

        // Update integration status periodically
        this.statusUpdateInterval = setInterval(() => {
            this.updateIntegrationStatus();
        }, 10000); // Every 10 seconds

        // Initial status update
        setTimeout(() => {
            this.updateIntegrationStatus();
        }, 2000);
    }

    saveBinanceApiKeys() {
        const apiKey = document.getElementById('binance-api-key').value;
        const secretKey = document.getElementById('binance-secret-key').value;

        if (!apiKey || !secretKey) {
            this.showNotification('Please enter both API key and secret key', 'error');
            return;
        }

        if (window.integrationManager) {
            document.dispatchEvent(new CustomEvent('configureApiKeys', {
                detail: {
                    exchange: 'binance',
                    keys: {
                        apiKey: apiKey,
                        secretKey: secretKey
                    }
                }
            }));

            // Clear the input fields for security
            document.getElementById('binance-api-key').value = '';
            document.getElementById('binance-secret-key').value = '';
        } else {
            this.showNotification('Integration manager not available', 'error');
        }
    }

    updateIntegrationStatus() {
        if (!window.integrationManager) return;

        const status = window.integrationManager.getIntegrationStatus();
        const statusContainer = document.getElementById('integration-status');
        
        if (statusContainer) {
            statusContainer.innerHTML = `
                <div class="integration-status">
                    <h4>Active Integrations:</h4>
                    <ul>
                        ${status.active.map(integration => 
        `<li class="change-positive">✓ ${integration}</li>`
    ).join('')}
                    </ul>
                    <h4>Features:</h4>
                    <ul>
                        <li class="${status.priceFeeds ? 'change-positive' : 'change-negative'}">
                            ${status.priceFeeds ? '✓' : '✗'} Real-time Price Feeds
                        </li>
                        <li class="${status.webSocket ? 'change-positive' : 'change-negative'}">
                            ${status.webSocket ? '✓' : '✗'} WebSocket Connection
                        </li>
                        <li class="${status.apiKeys.binance.configured ? 'change-positive' : 'change-negative'}">
                            ${status.apiKeys.binance.configured ? '✓' : '✗'} Binance API Keys
                        </li>
                    </ul>
                </div>
            `;
        }
    }

    startPriceUpdates() {
        // Price updates are now handled by IntegrationManager
        // This method is kept for backward compatibility
        console.log('Price updates managed by IntegrationManager');
    }

    refreshPortfolio() {
        this.showNotification('Portfolio refreshed', 'info');
        this.renderPortfolio();
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'assertive');
        notification.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: ${type === 'success' ? 'var(--secondary-color)' : 
        type === 'error' ? 'var(--danger-color)' : 
            type === 'warning' ? 'var(--warning-color)' : 'var(--primary-color)'};
            color: white;
            padding: 1rem 1.5rem;
            border-radius: 8px;
            box-shadow: var(--shadow-lg);
            z-index: 10000;
            animation: slideIn 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        // Add close button for accessibility
        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '×';
        closeBtn.setAttribute('aria-label', 'Close notification');
        closeBtn.style.cssText = `
            background: none;
            border: none;
            color: white;
            font-size: 1.2rem;
            float: right;
            margin-left: 10px;
            cursor: pointer;
            padding: 0;
            line-height: 1;
        `;
        
        const messageSpan = document.createElement('span');
        messageSpan.textContent = message;
        
        notification.appendChild(messageSpan);
        notification.appendChild(closeBtn);
        document.body.appendChild(notification);
        
        // Close button functionality
        const closeNotification = () => {
            if (notification.parentNode) {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    if (notification.parentNode) {
                        notification.parentNode.removeChild(notification);
                    }
                }, 300);
            }
        };
        
        closeBtn.addEventListener('click', closeNotification);
        
        // Auto remove after 5 seconds (increased for accessibility)
        setTimeout(closeNotification, 5000);
    }

    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Enhanced trade result waiting with better error handling
    waitForTradeResult(timeoutMs = 10000) {
        return new Promise((resolve, reject) => {
            let checkCount = 0;
            const maxChecks = timeoutMs / 100;
            
            const timeout = setTimeout(() => {
                reject(new Error(`Trade execution timeout after ${timeoutMs/1000}s`));
            }, timeoutMs);
            
            const checkResult = () => {
                checkCount++;
                
                if (this.pendingTradeResult) {
                    clearTimeout(timeout);
                    const result = this.pendingTradeResult;
                    this.pendingTradeResult = null;
                    resolve(result);
                } else if (checkCount >= maxChecks) {
                    clearTimeout(timeout);
                    reject(new Error('Trade result check limit exceeded'));
                } else {
                    setTimeout(checkResult, 100);
                }
            };
            
            // Start checking immediately
            checkResult();
        });
    }
    
    // Enhanced cleanup method with comprehensive resource management
    destroy() {
        try {
            // Clear intervals
            if (this.statusUpdateInterval) {
                clearInterval(this.statusUpdateInterval);
                this.statusUpdateInterval = null;
            }
            
            // Remove event listeners with proper cleanup
            if (this.tradeResultHandler) {
                document.removeEventListener('tradeResult', this.tradeResultHandler);
                this.tradeResultHandler = null;
            }
            
            if (this.integrationReadyHandler) {
                document.removeEventListener('integrationManagerReady', this.integrationReadyHandler);
                this.integrationReadyHandler = null;
            }
            
            // Clear pending trade results
            this.pendingTradeResult = null;
            
            // Reset connection state
            this.isConnected = false;
            
            console.log('🧹 TradrXBridge cleaned up successfully');
        } catch (error) {
            console.error('❌ Error during TradrXBridge cleanup:', error);
        }
    }
    
    // Security and settings management
    clearAllApiKeys() {
        if (confirm('⚠️ Are you sure you want to clear all API keys? This action cannot be undone.')) {
            try {
                if (window.integrationManager && window.integrationManager.apiManager) {
                    window.integrationManager.apiManager.clearAllApiKeys();
                }
                
                // Clear input fields
                const apiKeyInput = document.getElementById('binance-api-key');
                const secretKeyInput = document.getElementById('binance-secret-key');
                if (apiKeyInput) apiKeyInput.value = '';
                if (secretKeyInput) secretKeyInput.value = '';
                
                this.showNotification('All API keys cleared successfully', 'success');
                this.updateIntegrationStatus();
            } catch (error) {
                console.error('Error clearing API keys:', error);
                this.showNotification('Error clearing API keys', 'error');
            }
        }
    }
    
    exportSettings() {
        try {
            const settings = {
                version: '2.0.0',
                timestamp: new Date().toISOString(),
                portfolio: this.portfolio,
                tradingPairs: Array.from(this.tradingPairs.entries()),
                recentOrders: this.activeOrders.slice(-10) // Last 10 orders
            };
            
            const blob = new Blob([JSON.stringify(settings, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `tradrxbridge-settings-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showNotification('Settings exported successfully', 'success');
        } catch (error) {
            console.error('Export error:', error);
            this.showNotification('Error exporting settings', 'error');
        }
    }
    
    importSettings(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const settings = JSON.parse(e.target.result);
                
                if (!settings.version || !settings.timestamp) {
                    throw new Error('Invalid settings file format');
                }
                
                // Import portfolio data
                if (settings.portfolio) {
                    this.portfolio = { ...this.portfolio, ...settings.portfolio };
                }
                
                // Import trading pairs
                if (settings.tradingPairs) {
                    settings.tradingPairs.forEach(([key, value]) => {
                        this.tradingPairs.set(key, value);
                    });
                    this.renderTradingPairs();
                }
                
                // Import recent orders
                if (settings.recentOrders) {
                    this.activeOrders = [...this.activeOrders, ...settings.recentOrders];
                    this.renderPortfolio();
                }
                
                this.showNotification('Settings imported successfully', 'success');
            } catch (error) {
                console.error('Import error:', error);
                this.showNotification('Error importing settings: Invalid file format', 'error');
            }
        };
        
        reader.readAsText(file);
        event.target.value = ''; // Reset file input
    }
}

// Add notification animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Enhanced initialization with singleton pattern and proper cleanup
class TradingBridgeSingleton {
    constructor() {
        this.instance = null;
        this.isInitializing = false;
    }

    async getInstance() {
        if (this.instance) {
            return this.instance;
        }

        if (this.isInitializing) {
            // Wait for initialization to complete
            while (this.isInitializing) {
                await new Promise(resolve => setTimeout(resolve, 50));
            }
            return this.instance;
        }

        this.isInitializing = true;
        try {
            this.instance = new TradrXBridge();
            
            // Setup cleanup on page unload
            window.addEventListener('beforeunload', () => {
                if (this.instance) {
                    this.instance.destroy();
                }
            });
            
            return this.instance;
        } finally {
            this.isInitializing = false;
        }
    }
}

// Create singleton instance
const tradingBridgeSingleton = new TradingBridgeSingleton();

// Enhanced initialization function
const initializeTradingBridge = async () => {
    try {
        const bridge = await tradingBridgeSingleton.getInstance();
        window.tradingBridge = bridge;
        return bridge;
    } catch (error) {
        console.error('❌ Failed to initialize Trading Bridge:', error);
        return null;
    }
};

// Smart initialization based on document state
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTradingBridge, { once: true });
} else {
    // DOM already loaded, initialize with slight delay to ensure all scripts are loaded
    setTimeout(initializeTradingBridge, 100);
}

// Export for global access
window.initializeTradingBridge = initializeTradingBridge;
