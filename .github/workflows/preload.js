const { contextBridge, ipcRenderer } = require('electron');

// Expose a secure API to the renderer process for Node.js functionality
contextBridge.exposeInMainWorld('nodeAPI', {
  // System & Process Management
  listProcesses: () => ipcRenderer.invoke('listProcesses'),
  killProcess: (name) => ipcRenderer.invoke('killProcess', name),
  launchProcess: (cmd) => ipcRenderer.invoke('launchProcess', cmd),
  getSystemInfo: () => ipcRenderer.invoke('getSystemInfo'),
  getMemoryUsage: () => ipcRenderer.invoke('get-memory-usage'),
  runCommand: (command) => ipcRenderer.invoke('runCommand', command),
  cleanTempDir: () => ipcRenderer.invoke('cleanTempDir'),

  // Python & Network Orchestration
  runPython: (options) => ipcRenderer.invoke('runPython', options),
  listPythonEnvs: () => ipcRenderer.invoke('listPythonEnvs'),
  scanNetwork: (options) => ipcRenderer.invoke('scanNetwork', options),

  // File System Operations
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  writeFile: (filePath, content) => ipcRenderer.invoke('write-file', filePath, content),
  readFolderFiles: (folderPath) => ipcRenderer.invoke('read-folder-files', folderPath),
  readFile: (filePath) => ipcRenderer.invoke('read-file', filePath),

  // Versioning
  listVersions: (filePath) => ipcRenderer.invoke('list-versions', filePath),
  loadVersion: (versionFile) => ipcRenderer.invoke('load-version', versionFile),

  // AI/Chat
  askAi: (prompt) => ipcRenderer.invoke('ask-ai', prompt),
  
  // Listener for events from the main process
  on: (channel, func) => {
    const validChannels = ['folder-tree', 'notify', 'log', 'transparency', 'override']; // Expanded whitelist
    if (validChannels.includes(channel)) {
      ipcRenderer.on(channel, (event, ...args) => func(...args));
    }
  }
});

// Extended secure API for agent communication and logs
contextBridge.exposeInMainWorld('agentsAPI', {
  getAgents: () => ipcRenderer.invoke('get-agents'),
  callAgent: (agentName, funcName, ...args) => ipcRenderer.invoke('call-agent', { agentName, funcName, args }),
  // Unified log action
  logAction: async (entry) => {
    try {
      return await ipcRenderer.invoke('log-action', entry);
    } catch (e) {
      console.error('logAction error:', e);
      return { success: false, error: e.message };
    }
  },
  // Transparency log
  transparencyLog: async (entry) => {
    try {
      return await ipcRenderer.invoke('transparency-log', entry);
    } catch (e) {
      console.error('transparencyLog error:', e);
      return { success: false, error: e.message };
    }
  },
  // User override API
  overrideAPI: async (action, payload) => {
    try {
      return await ipcRenderer.invoke('override-api', { action, payload });
    } catch (e) {
      console.error('overrideAPI error:', e);
      return { success: false, error: e.message };
    }
  }
});
