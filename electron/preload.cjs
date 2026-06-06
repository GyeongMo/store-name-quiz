const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  saveResult: (payload) => ipcRenderer.invoke('dialog:saveResult', payload),
  // 편집기 저장 내용을 기본 퀴즈 데이터 파일(src/data/quizzes.json)에 영구 기록
  savePool: (json) => ipcRenderer.invoke('quiz:savePool', json),
  isElectron: true,
});
