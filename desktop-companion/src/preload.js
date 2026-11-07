/* The only things the window can ask the main process for. */
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('companion', {
  state: () => ipcRenderer.invoke('state'),
  connect: () => ipcRenderer.invoke('connect'),
  signOut: () => ipcRenderer.invoke('signOut'),
  saveSettings: (patch) => ipcRenderer.invoke('saveSettings', patch),
  targets: () => ipcRenderer.invoke('targets'),
  transcribe: (audio, mimeType) => ipcRenderer.invoke('transcribe', { audio, mimeType }),
  assist: (payload) => ipcRenderer.invoke('assist', payload),
  askCopilot: (payload) => ipcRenderer.invoke('askCopilot', payload),
  analyzeScreen: (question) => ipcRenderer.invoke('analyzeScreen', question),
  micPermission: () => ipcRenderer.invoke('micPermission'),
  saveNotes: (markdown) => ipcRenderer.invoke('saveNotes', markdown),
  openWeb: (where) => ipcRenderer.invoke('openWeb', where),
  onConnectCode: (fn) => ipcRenderer.on('connectCode', (_e, code) => fn(code)),
});
