document.addEventListener('DOMContentLoaded', () => {
    const infoButton = document.getElementById('infoButton');
    const info = document.getElementById('info');

    if (infoButton) {
        infoButton.addEventListener('click', () => {
            info.textContent = 'TradrXBridge is under construction. Stay tuned for updates!';
        });
    }
});
