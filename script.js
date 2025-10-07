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

const STORAGE_KEY = 'tradrxbridgeUsers';
const SESSION_KEY = 'tradrxbridgeSession';

const safeEncode = (value) => {
    try {
        return window.btoa(unescape(encodeURIComponent(value)));
    } catch (error) {
        console.error('Encoding failed', error);
        return window.btoa(value);
    }
};

const loadUsers = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return stored ? JSON.parse(stored) : [];
    } catch (error) {
        console.warn('Unable to load accounts', error);
        return [];
    }
};

const saveUsers = (users) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(users));
};

const getSession = () => localStorage.getItem(SESSION_KEY);
const setSession = (email) => localStorage.setItem(SESSION_KEY, email);
const clearSession = () => localStorage.removeItem(SESSION_KEY);

const findUser = (email) => {
    const normalized = (email || '').trim().toLowerCase();
    return loadUsers().find((user) => user.email === normalized);
};

const initAuthModal = () => {
    const modal = document.getElementById('authModal');
    const accountButton = document.getElementById('accountButton');
    if (!modal || !accountButton) {
        return;
    }

    const body = document.body;
    const content = modal.querySelector('.modal__content');
    const panels = {
        signin: modal.querySelector('[data-auth-panel="signin"]'),
        signup: modal.querySelector('[data-auth-panel="signup"]'),
    };

    let lastFocusedElement = null;
    let currentMode = 'signin';

    const focusFirstField = () => {
        const panel = panels[currentMode];
        if (!panel) {
            return;
        }
        const input = panel.querySelector('input');
        if (input) {
            input.focus();
        }
    };

    const setMode = (mode) => {
        currentMode = mode;
        content?.setAttribute('data-auth-mode', mode);
        Object.entries(panels).forEach(([key, panel]) => {
            if (!panel) {
                return;
            }
            panel.hidden = key !== mode;
        });
        window.requestAnimationFrame(focusFirstField);
    };

    const closeModal = () => {
        modal.hidden = true;
        body.classList.remove('is-modal-open');
        if (lastFocusedElement) {
            lastFocusedElement.focus();
        }
    };

    const openModal = (mode = 'signin') => {
        lastFocusedElement = document.activeElement;
        setMode(mode);
        modal.hidden = false;
        body.classList.add('is-modal-open');
    };

    const resetForms = () => {
        modal.querySelectorAll('form').forEach((form) => {
            form.reset();
            form.querySelectorAll('.form-error').forEach((error) => {
                error.textContent = '';
            });
            form.querySelectorAll('input').forEach((input) => {
                input.removeAttribute('aria-invalid');
            });
            const success = form.querySelector('.form-success');
            if (success) {
                success.hidden = true;
                success.textContent = '';
            }
        });
    };

    const updateAccountState = () => {
        const session = getSession();
        if (session) {
            accountButton.textContent = 'Sign out';
            accountButton.dataset.accountState = 'signed-in';
        } else {
            accountButton.textContent = 'Client sign in';
            accountButton.dataset.accountState = 'signed-out';
        }
    };

    const showSuccess = (element, message) => {
        if (!element) {
            return;
        }
        if (!message) {
            element.textContent = '';
            element.hidden = true;
            return;
        }
        element.textContent = message;
        element.hidden = false;
    };

    const setFieldState = (input, errorElement, message = '') => {
        if (!input || !errorElement) {
            return;
        }
        if (message) {
            errorElement.textContent = message;
            input.setAttribute('aria-invalid', 'true');
        } else {
            errorElement.textContent = '';
            input.removeAttribute('aria-invalid');
        }
    };

    const signInForm = document.getElementById('signInForm');
    const signUpForm = document.getElementById('signUpForm');

    signInForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const emailInput = signInForm.querySelector('#signInEmail');
        const passwordInput = signInForm.querySelector('#signInPassword');
        const success = document.getElementById('signInSuccess');
        showSuccess(success, '');

        const email = emailInput?.value ?? '';
        const password = passwordInput?.value ?? '';
        setFieldState(emailInput, document.getElementById('signInEmailError'));
        setFieldState(passwordInput, document.getElementById('signInPasswordError'));

        if (!/.+@.+\..+/.test(email)) {
            setFieldState(emailInput, document.getElementById('signInEmailError'), 'Enter the email you registered with.');
            return;
        }

        if (password.trim().length < 8) {
            setFieldState(passwordInput, document.getElementById('signInPasswordError'), 'Passwords are at least 8 characters.');
            return;
        }

        const user = findUser(email);
        if (!user) {
            setFieldState(emailInput, document.getElementById('signInEmailError'), 'We couldn\'t find an account. Create one first.');
            return;
        }

        const encoded = safeEncode(password.trim());
        if (user.password !== encoded) {
            setFieldState(passwordInput, document.getElementById('signInPasswordError'), 'That password does not match our records.');
            return;
        }

        showSuccess(success, 'Signed in successfully. Redirecting to your workspace...');
        setSession(user.email);
        updateAccountState();
        window.setTimeout(() => {
            closeModal();
            resetForms();
        }, 900);
    });

    signUpForm?.addEventListener('submit', (event) => {
        event.preventDefault();
        const nameInput = signUpForm.querySelector('#signUpName');
        const emailInput = signUpForm.querySelector('#signUpEmail');
        const passwordInput = signUpForm.querySelector('#signUpPassword');
        const success = document.getElementById('signUpSuccess');
        showSuccess(success, '');

        const name = nameInput?.value ?? '';
        const email = (emailInput?.value ?? '').trim().toLowerCase();
        const password = passwordInput?.value ?? '';

        setFieldState(nameInput, document.getElementById('signUpNameError'));
        setFieldState(emailInput, document.getElementById('signUpEmailError'));
        setFieldState(passwordInput, document.getElementById('signUpPasswordError'));

        if (name.trim().length < 2) {
            setFieldState(nameInput, document.getElementById('signUpNameError'), 'Share your full name so we can personalise access.');
            return;
        }

        if (!/.+@.+\..+/.test(email)) {
            setFieldState(emailInput, document.getElementById('signUpEmailError'), 'Use a valid work email address.');
            return;
        }

        if (password.trim().length < 8) {
            setFieldState(passwordInput, document.getElementById('signUpPasswordError'), 'Choose a password with at least 8 characters.');
            return;
        }

        if (findUser(email)) {
            setFieldState(emailInput, document.getElementById('signUpEmailError'), 'That email is already registered. Sign in instead.');
            return;
        }

        const users = loadUsers();
        users.push({
            name: name.trim(),
            email,
            password: safeEncode(password.trim()),
        });
        saveUsers(users);
        setSession(email);
        updateAccountState();
        showSuccess(success, 'Account created. You are signed in.');
        window.setTimeout(() => {
            closeModal();
            resetForms();
        }, 900);
    });

    modal.addEventListener('click', (event) => {
        const target = event.target;
        if (!(target instanceof HTMLElement)) {
            return;
        }
        const action = target.dataset.authAction;
        if (action === 'close') {
            closeModal();
            resetForms();
        }
    });

    modal.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            closeModal();
            resetForms();
        }
    });

    modal.querySelectorAll('[data-auth-switch]').forEach((toggle) => {
        toggle.addEventListener('click', () => {
            const mode = toggle.getAttribute('data-auth-switch');
            if (!mode) {
                return;
            }
            resetForms();
            setMode(mode);
        });
    });

    accountButton.addEventListener('click', () => {
        if (accountButton.dataset.accountState === 'signed-in') {
            clearSession();
            updateAccountState();
        } else {
            resetForms();
            openModal('signin');
        }
    });

    updateAccountState();
};

const init = () => {
    initNavigation();
    initSmoothScroll();
    revealOnScroll();
    countOnView();
    initContactForm();
    initAuthModal();
    setCurrentYear();
};

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
} else {
    init();
}
