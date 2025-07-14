/**
 * Supreme OS Editor - Modular, Smart, Self-Improving Agent, Accessible, RTL, Dark/Light Themes
 * 
 * This is the main renderer process script for the Electron application.
 * It handles all UI interactions, state management, and communication with the main process.
 */

// =================================================================================
// STATE MANAGEMENT & INITIALIZATION
// =================================================================================

const state = {
    currentTheme: 'dark',
    activePanel: 'home',
    isMaximized: false,
    user: { name: 'Admin', preferences: {} },
};

let editor; // Ace Editor instance

// Initialize the application when the DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed. Initializing application...');
    try {
        initializeTheme();
        initializeUI();
        setupEventListeners();
        loadInitialPanel();
        initializeEditor();

        // Notify the main process that the renderer is ready
        if (window.electronAPI && window.electronAPI.rendererReady) {
            window.electronAPI.rendererReady();
        }
        createNotification('System Initialized. Welcome!', 'success');
    } catch (error) {
        console.error('Fatal error during initialization:', error);
        createNotification(`Initialization failed: ${error.message}`, 'error');
    }
});

// =================================================================================
// THEME MANAGEMENT
// =================================================================================

function initializeTheme() {
    const savedTheme = localStorage.getItem('theme') || 'dark';
    state.currentTheme = savedTheme;
    document.body.className = `${savedTheme}-theme`;
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = savedTheme === 'light';
    }
}

function toggleTheme() {
    state.currentTheme = state.currentTheme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('theme', state.currentTheme);
    document.body.className = `${state.currentTheme}-theme`;
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.checked = state.currentTheme === 'light';
    }
    createNotification(`Theme changed to ${state.currentTheme}`, 'info');
}

// =================================================================================
// UI INITIALIZATION & PANEL MANAGEMENT
// =================================================================================

function initializeUI() {
    // Initialize any necessary UI components here
    console.log('UI Initialized.');
}

function loadInitialPanel() {
    const initialPanel = location.hash.substring(1) || 'home';
    showPanel(initialPanel);
}

function showPanel(panelId, event = null) {
    if (event) {
        event.preventDefault();
    }

    console.log(`Attempting to show panel: ${panelId}`);
    const panels = document.querySelectorAll('.content-panel');
    panels.forEach(panel => {
        panel.style.display = 'none';
    });

    const targetPanel = document.getElementById(panelId);
    if (targetPanel) {
        targetPanel.style.display = 'block';
        state.activePanel = panelId;
        if (window.location.hash !== `#${panelId}`) {
            location.hash = panelId;
        }
        updateActiveNav(panelId);
        console.log(`Panel ${panelId} displayed.`);

        // Initialize panel-specific logic if it exists
        switch (panelId) {
            case 'system':
                if (typeof initializeSystemPanel === 'function') initializeSystemPanel();
                break;
            case 'processes':
                if (typeof initializeProcessControlPanel === 'function') initializeProcessControlPanel();
                break;
            case 'upgrade-advisor':
                 if (typeof initializeUpgradeAdvisor === 'function') initializeUpgradeAdvisor();
                 break;
        }
    } else {
        console.error(`Panel with ID '${panelId}' not found. Falling back to home.`);
        const homePanel = document.getElementById('home');
        if(homePanel) homePanel.style.display = 'block';
        state.activePanel = 'home';
        location.hash = 'home';
        updateActiveNav('home');
    }
}

function updateActiveNav(panelId) {
    const navLinks = document.querySelectorAll('nav a');
    navLinks.forEach(link => {
        if (link.getAttribute('href') === `#${panelId}`) {
            link.classList.add('active');
        } else {
            link.classList.remove('active');
        }
    });
}

// =================================================================================
// EVENT LISTENERS
// =================================================================================

function setupEventListeners() {
    console.log('Setting up event listeners...');

    // Theme Toggle
    const themeToggle = document.getElementById('theme-toggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }

    // Navigation Links
    document.querySelectorAll('nav a').forEach(link => {
        link.addEventListener('click', (event) => {
            const panelId = link.getAttribute('href').substring(1);
            showPanel(panelId, event);
        });
    });

    // Window Controls
    const minimizeBtn = document.getElementById('minimize-btn');
    const maximizeBtn = document.getElementById('maximize-btn');
    const closeBtn = document.getElementById('close-btn');

    if (minimizeBtn) minimizeBtn.addEventListener('click', () => window.electronAPI?.minimizeWindow());
    if (maximizeBtn) maximizeBtn.addEventListener('click', () => window.electronAPI?.maximizeWindow());
    if (closeBtn) closeBtn.addEventListener('click', () => window.electronAPI?.closeWindow());

    // Handle hash changes for browser back/forward
    window.addEventListener('hashchange', loadInitialPanel);

    // Global error handlers
    window.addEventListener('error', (event) => {
        console.error('Global error:', event.message, event.filename, event.lineno);
        createNotification(`An error occurred: ${event.message}`, 'error');
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('Unhandled promise rejection:', event.reason);
        createNotification(`An unhandled promise rejection occurred: ${event.reason.message || event.reason}`, 'error');
    });

    console.log('Event listeners set up successfully.');
}

// =================================================================================
// ACE EDITOR SETUP
// =================================================================================

function initializeEditor() {
    const editorEl = document.getElementById('editor');
    if (!editorEl) {
        console.error('Editor element #editor not found!');
        return;
    }
    editor = ace.edit(editorEl);
    editor.setTheme('ace/theme/monokai');
    editor.session.setMode('ace/mode/javascript');
    editor.setOptions({
        fontSize: '14px',
        wrap: true,
        enableBasicAutocompletion: true,
        enableLiveAutocompletion: true,
        enableSnippets: true
    });

    // Auto-backup editor content
    let backupTimer;
    editor.session.on('change', () => {
        clearTimeout(backupTimer);
        backupTimer = setTimeout(() => {
            localStorage.setItem('editorContentBackup', editor.getValue());
            createNotification('Work saved to local backup.', 'info');
        }, 1500);
    });

    // Restore from backup
    const backup = localStorage.getItem('editorContentBackup');
    if (backup) {
        editor.setValue(backup, 1);
    }
}

// UTILITY FUNCTIONS
// =================================================================================

// Unified notification and log system with override and self-improvement hooks
function createNotification(message, type = 'info', opts = {}) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.setAttribute('role', 'alert');
    notification.setAttribute('aria-live', 'polite');
    notification.innerText = message;
    // Ensure a single container for notifications
    let container = document.getElementById('notification-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'notification-container';
        container.style.position = 'fixed';
        container.style.top = '24px';
        container.style.right = '24px';
        container.style.zIndex = '9999';
        document.body.appendChild(container);
    }
    container.appendChild(notification);
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, opts.duration || 4000);
    // Unified log (with override hook)
    if (window.agentsAPI && typeof window.agentsAPI.logAction === 'function') {
        window.agentsAPI.logAction({
            type: 'notification',
            message,
            level: type,
            time: new Date().toISOString(),
            ...opts
        });
// =================================================================================

// Sidebar filtering
function filterSidebarFiles(query) {
    const fileList = document.getElementById('fileList');
    if (!fileList) return;
    const items = fileList.querySelectorAll('li');
    query = query.toLowerCase();
    items.forEach(item => {
        const text = item.textContent.toLowerCase();
        item.style.display = text.includes(query) ? '' : 'none';
    });
}

// New file/folder creation
async function createNewFile() {
    const fileName = prompt('שם הקובץ החדש (כולל סיומת):');
    if (fileName && window.electronAPI && window.electronAPI.createFile) {
        await window.electronAPI.createFile(fileName);
        createNotification('קובץ חדש נוצר בהצלחה!', 'success');
    }
}

async function createNewFolder() {
    const folderName = prompt('שם התיקיה החדשה:');
    if (folderName && window.electronAPI && window.electronAPI.createFolder) {
        await window.electronAPI.createFolder(folderName);
        createNotification('תיקיה חדשה נוצרה בהצלחה!', 'success');
    }
}

// Tabs state and logic
window.tabsState = { open: [], active: null };

function renderTabs() {
    // This is a placeholder for a real tabs UI implementation
    // Should be replaced with a full-featured tabs bar
    const tabsBar = document.getElementById('tabsBar');
    if (!tabsBar) return;
    tabsBar.innerHTML = '';
    window.tabsState.open.forEach(tab => {
        const tabEl = document.createElement('button');
        tabEl.className = 'tab-btn';
        tabEl.textContent = tab.name;
        if (window.tabsState.active && window.tabsState.active.path === tab.path) {
            tabEl.classList.add('active');
        }
        tabEl.onclick = () => openFileInEditor(tab.path);
        tabsBar.appendChild(tabEl);
    });
}
window.renderTabs = renderTabs;

// File open logic
async function openFileInEditor(filePath) {
    if (!window.electronAPI || !window.electronAPI.readFile) return;
    const content = await window.electronAPI.readFile(filePath);
    if (editor) editor.setValue(content, 1);
    // Track open tabs
    let tab = window.tabsState.open.find(t => t.path === filePath);
    if (!tab) {
        tab = { name: filePath.split(/[\\/]/).pop(), path: filePath };
        window.tabsState.open.push(tab);
    }
    window.tabsState.active = tab;
    renderTabs();
}
window.openFileInEditor = openFileInEditor;

// Sidebar tree rendering (basic)
function renderSidebarTree(tree) {
    const container = document.getElementById('fileListDisplay');
    if (!container) return;
    container.innerHTML = '';
    if (!tree) return;
    function createNode(node) {
        const li = document.createElement('li');
        li.textContent = node.name;
        li.className = node.type;
        li.onclick = (e) => {
            e.stopPropagation();
            if (node.type === 'file') openFileInEditor(node.path);
        };
        if (node.type === 'directory' && node.children) {
            const ul = document.createElement('ul');
            node.children.forEach(child => ul.appendChild(createNode(child)));
            li.appendChild(ul);
        }
        return li;
    }
    const rootUl = document.createElement('ul');
    rootUl.appendChild(createNode(tree));
    container.appendChild(rootUl);
}
window.renderSidebarTree = renderSidebarTree;

// =================================================================================
// AGENT & SELF-IMPROVEMENT LOGIC
// =================================================================================

const editorAgent = {
    suggestImprovements() {
        if (!editor) return;
        const val = editor.getValue();
        if (val.includes('var ')) {
            createNotification('המלצה: השתמש ב-let/const במקום var לקוד מודרני.', 'info');
        }
        if ((val.match(/console\.log\(/g) || []).length > 5) {
            createNotification('המלצה: יש הרבה console.log, שקול לצמצם לוגים בקוד סופי.', 'info');
        }
    },
    autoImprove() {
        if (!editor) return;
        let val = editor.getValue();
        let fixed = val.replace(/\t/g, '  ');
        if (fixed !== val) {
            editor.setValue(fixed, 1);
            createNotification('בוצע תיקון אוטומטי: כל ה-tab הומרו ל-2 רווחים.', 'success');
        }
    },
    run() {
        setTimeout(() => {
            this.suggestImprovements();
            this.autoImprove();
        }, 2000);
    }
};
window.editorAgent = editorAgent;

document.addEventListener('DOMContentLoaded', () => {
    if (window.editorAgent) window.editorAgent.run();
});
