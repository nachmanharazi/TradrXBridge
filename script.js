document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('infoButton');
    const info = document.getElementById('info');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            info.textContent = 'TradrXBridge is under construction. Stay tuned for updates!';
        });
    }

    const chartsContainer = document.getElementById('chartsContainer');
    const symbolInput = document.getElementById('symbolInput');
    const addChartBtn = document.getElementById('addChart');

    function addChart(symbol) {
        if (!window.TradingView || !chartsContainer || !symbol) return;
        const containerId = `chart-${symbol.replace(/[^a-zA-Z0-9]/g, '-')}`;
        const div = document.createElement('div');
        div.id = containerId;
        div.className = 'chart';
        chartsContainer.appendChild(div);

        new TradingView.widget({
            container_id: containerId,
            width: "100%",
            height: 400,
            symbol: symbol,
            interval: "D",
            timezone: "Etc/UTC",
            theme: "light",
            style: "1",
            locale: "en",
            toolbar_bg: "#f1f3f6",
            enable_publishing: false,
            allow_symbol_change: false
        });
    }

    const defaultSymbols = ['BINANCE:BTCUSDT', 'BINANCE:ETHUSDT'];
    defaultSymbols.forEach(addChart);

    if (addChartBtn) {
        addChartBtn.addEventListener('click', () => {
            const symbol = symbolInput.value.trim();
            if (symbol) {
                addChart(symbol.toUpperCase());
                symbolInput.value = '';
            }
        });
    }
});
