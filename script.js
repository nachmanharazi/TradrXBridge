const easeOutQuad = (t) => t * (2 - t);

const animateCount = (element) => {
    const target = Number(element.dataset.countTo);
    if (!Number.isFinite(target) || element.dataset.counted === 'true') {
        return;
    }

    const duration = 1400;
    const startTime = performance.now();

    const update = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(1, elapsed / duration);
        const eased = easeOutQuad(progress);
        const value = Math.round(eased * target);
        element.textContent = value.toString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.dataset.counted = 'true';
        }
    };

    requestAnimationFrame(update);
};

const initInViewAnimations = () => {
    const animatedElements = document.querySelectorAll('[data-animate]');
    if (!animatedElements.length) {
        return;
    }

    const observer = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                const value = entry.target.querySelector('[data-count-to]');
                if (value) {
                    animateCount(value);
                }
            }
        });
    }, {
        rootMargin: '0px 0px -10% 0px',
        threshold: 0.2,
    });

    animatedElements.forEach((element) => observer.observe(element));
};

const initCountUpPanels = () => {
    const countTargets = document.querySelectorAll('[data-count-to]');
    if (!countTargets.length) {
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.5,
    });

    countTargets.forEach((target) => observer.observe(target));
};

const initSmoothScroll = () => {
    const scrollButtons = document.querySelectorAll('a[href^="#"], [data-scroll-target]');

    scrollButtons.forEach((button) => {
        button.addEventListener('click', (event) => {
            const targetSelector = button.dataset.scrollTarget || button.getAttribute('href');
            if (!targetSelector || targetSelector === '#') {
                return;
            }

            const target = document.querySelector(targetSelector);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });

            const navList = document.querySelector('.site-nav__list');
            const navToggle = document.querySelector('.site-nav__toggle');
            if (navList?.classList.contains('is-open')) {
                navList.classList.remove('is-open');
                if (navToggle) {
                    navToggle.setAttribute('aria-expanded', 'false');
                }
            }
        });
    });
};

const initNavigation = () => {
    const navToggle = document.querySelector('.site-nav__toggle');
    const navList = document.querySelector('.site-nav__list');

    if (!navToggle || !navList) {
        return;
    }

    navToggle.addEventListener('click', () => {
        const isOpen = navList.classList.toggle('is-open');
        navToggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
        if (!navList.classList.contains('is-open')) {
            return;
        }

        const isClickInside = navList.contains(event.target) || navToggle.contains(event.target);
        if (!isClickInside) {
            navList.classList.remove('is-open');
            navToggle.setAttribute('aria-expanded', 'false');
        }
    });
};

const initContactForm = () => {
    const form = document.getElementById('contactForm');
    if (!form) {
        return;
    }

    const fields = {
        name: {
            input: form.querySelector('#name'),
            error: form.querySelector('#nameError'),
            validator: (value) => value.trim().length > 1,
            message: 'Please share your full name.',
        },
        email: {
            input: form.querySelector('#email'),
            error: form.querySelector('#emailError'),
            validator: (value) => /.+@.+\..+/.test(value),
            message: 'Enter a valid work email.',
        },
        company: {
            input: form.querySelector('#company'),
            error: form.querySelector('#companyError'),
            validator: (value) => value.trim().length > 1,
            message: 'Your company name helps us customize the demo.',
        },
        message: {
            input: form.querySelector('#message'),
            error: form.querySelector('#messageError'),
            validator: (value) => value.trim().length > 5,
            message: 'Tell us a bit more so we can prepare relevant material.',
        },
    };

    const successMessage = form.querySelector('.form-success');

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let hasErrors = false;

        Object.values(fields).forEach(({ input, error, validator, message }) => {
            if (!input) {
                return;
            }

            const value = input.value || '';
            const isValid = validator(value);

            if (!isValid) {
                hasErrors = true;
                error.textContent = message;
                input.setAttribute('aria-invalid', 'true');
            } else {
                error.textContent = '';
                input.removeAttribute('aria-invalid');
            }
        });

        if (successMessage) {
            successMessage.hidden = hasErrors;
        }

        if (!hasErrors) {
            form.reset();
        }
    });
};

const setCurrentYear = () => {
    const yearElement = document.getElementById('currentYear');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear().toString();
    }
};

const init = () => {
    initNavigation();
    initSmoothScroll();
    initInViewAnimations();
    initCountUpPanels();
    initContactForm();
    setCurrentYear();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
