document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('infoButton');
    const info = document.getElementById('info');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            info.innerHTML = `
                <strong>TradrXBridge Platform Features:</strong><br>
                • Real-time market data and analytics<br>
                • Automated trading bot integration<br>
                • Multi-asset portfolio management<br>
                • Advanced risk management tools<br>
                • Secure API bridge connections<br>
                <em>Coming soon - Stay tuned for updates!</em>
            `;
        });
    }
});
