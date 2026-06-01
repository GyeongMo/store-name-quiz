const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveResult: (payload) => ipcRenderer.invoke('dialog:saveResult', payload),
  isElectron: true,
});
