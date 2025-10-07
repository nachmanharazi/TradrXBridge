document.addEventListener('DOMContentLoaded', () => {
    const learnMoreButton = document.getElementById('learnMoreButton');
    const toTopButton = document.getElementById('toTopButton');
    const currentYear = document.getElementById('currentYear');
    const metricsList = document.getElementById('metrics');
    const highlightsList = document.querySelector('[data-features]');

    if (currentYear) {
        currentYear.textContent = new Date().getFullYear();
    }

    if (learnMoreButton) {
        learnMoreButton.addEventListener('click', () => {
            document.getElementById('about')?.scrollIntoView({ behavior: 'smooth' });
        });
    }

    if (toTopButton) {
        toTopButton.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

    if (highlightsList) {
        const highlights = [
            {
                term: 'Direct venue connectivity',
                detail: 'Consolidate FIX, REST, and WebSocket flows with a single orchestration layer.',
            },
            {
                term: 'Compliance-ready controls',
                detail: 'Real-time risk checks, maker-taker policies, and automated trade attestations.',
            },
            {
                term: 'Data science friendly',
                detail: 'Stream normalized market data into notebooks or data lakes with built-in governance.',
            },
        ];

        highlightsList.innerHTML = highlights
            .map(
                (item) => `
                    <div class="highlight">
                        <dt>${item.term}</dt>
                        <dd>${item.detail}</dd>
                    </div>
                `,
            )
            .join('');
    }

    if (metricsList) {
        const metrics = [
            { value: '78%', label: 'Faster onboarding cycles with automated checks' },
            { value: '24/7', label: 'Cross-venue monitoring with unified alerts' },
            { value: '12ms', label: 'Median latency across supported exchanges' },
        ];

        metricsList.innerHTML = metrics
            .map(
                (metric) => `
                    <li class="metrics__item">
                        <span class="metrics__value">${metric.value}</span>
                        <span class="metrics__label">${metric.label}</span>
                    </li>
                `,
            )
            .join('');
    }

    const contactForm = document.querySelector('.contact__form');
    if (contactForm) {
        contactForm.addEventListener('submit', (event) => {
            event.preventDefault();
            const submitButton = contactForm.querySelector('button[type="submit"]');
            if (submitButton) {
                const originalText = submitButton.textContent;
                submitButton.textContent = 'Message received!';
                submitButton.disabled = true;
                window.setTimeout(() => {
                    submitButton.textContent = originalText;
                    submitButton.disabled = false;
                    contactForm.reset();
                }, 2000);
            }
        });
    }
});
