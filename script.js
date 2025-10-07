const easeOutQuad = (t) => t * (2 - t);

const animateCount = (element) => {
    const target = Number(element.dataset.countTo);
    if (!Number.isFinite(target) || element.dataset.counted === 'true') {
        return;
    }

    const duration = 1200;
    const startTime = performance.now();

    const update = (now) => {
        const progress = Math.min(1, (now - startTime) / duration);
        const value = Math.round(easeOutQuad(progress) * target);
        element.textContent = value.toString();

        if (progress < 1) {
            requestAnimationFrame(update);
        } else {
            element.dataset.counted = 'true';
        }
    };

    requestAnimationFrame(update);
};

const revealOnScroll = () => {
    const animated = document.querySelectorAll('[data-animate]');
    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                entry.target.classList.add('is-visible');
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.25 });

    animated.forEach((element) => observer.observe(element));
};

const countOnView = () => {
    const counters = document.querySelectorAll('[data-count-to]');
    if (!counters.length) {
        return;
    }

    const observer = new IntersectionObserver((entries, obs) => {
        entries.forEach((entry) => {
            if (entry.isIntersecting) {
                animateCount(entry.target);
                obs.unobserve(entry.target);
            }
        });
    }, { threshold: 0.6 });

    counters.forEach((counter) => observer.observe(counter));
};

const initSmoothScroll = () => {
    document.querySelectorAll('a[href^="#"], [data-scroll-target]').forEach((trigger) => {
        trigger.addEventListener('click', (event) => {
            const selector = trigger.dataset.scrollTarget || trigger.getAttribute('href');
            if (!selector || selector === '#') {
                return;
            }

            const target = document.querySelector(selector);
            if (!target) {
                return;
            }

            event.preventDefault();
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            closeMobileNav();
        });
    });
};

let closeMobileNav = () => {};

const initNavigation = () => {
    const toggle = document.querySelector('.site-nav__toggle');
    const list = document.querySelector('.site-nav__list');

    if (!toggle || !list) {
        closeMobileNav = () => {};
        return;
    }

    closeMobileNav = () => {
        list.classList.remove('is-open');
        toggle.setAttribute('aria-expanded', 'false');
    };

    toggle.addEventListener('click', () => {
        const isOpen = list.classList.toggle('is-open');
        toggle.setAttribute('aria-expanded', String(isOpen));
    });

    document.addEventListener('click', (event) => {
        if (!list.classList.contains('is-open')) {
            return;
        }

        if (!list.contains(event.target) && event.target !== toggle) {
            closeMobileNav();
        }
    });
};

const initContactForm = () => {
    const form = document.getElementById('contactForm');
    if (!form) {
        return;
    }

    const getField = (id) => ({
        input: form.querySelector(id),
        error: form.querySelector(`${id}Error`),
    });

    const fields = {
        name: getField('#name'),
        email: getField('#email'),
        company: getField('#company'),
        message: getField('#message'),
    };

    const success = form.querySelector('.form-success');

    const validators = {
        name: (value) => value.trim().length > 1,
        email: (value) => /.+@.+\..+/.test(value),
        company: (value) => value.trim().length > 1,
        message: (value) => value.trim().length > 5,
    };

    const messages = {
        name: 'Please share your full name.',
        email: 'Enter a valid work email.',
        company: 'Let us know where you trade from.',
        message: 'Add a short note so we can prepare.',
    };

    form.addEventListener('submit', (event) => {
        event.preventDefault();
        let hasErrors = false;

        Object.entries(fields).forEach(([key, { input, error }]) => {
            if (!input || !error) {
                return;
            }

            const value = input.value ?? '';
            const isValid = validators[key](value);

            if (!isValid) {
                hasErrors = true;
                error.textContent = messages[key];
                input.setAttribute('aria-invalid', 'true');
            } else {
                error.textContent = '';
                input.removeAttribute('aria-invalid');
            }
        });

        if (success) {
            success.hidden = hasErrors;
        }

        if (!hasErrors) {
            form.reset();
        }
    });
};

const setCurrentYear = () => {
    const year = document.getElementById('currentYear');
    if (year) {
        year.textContent = new Date().getFullYear().toString();
    }
};

const init = () => {
    initNavigation();
    initSmoothScroll();
    revealOnScroll();
    countOnView();
    initContactForm();
    setCurrentYear();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
