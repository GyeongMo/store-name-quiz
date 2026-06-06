const { app, BrowserWindow, Menu, dialog, ipcMain } = require('electron');
const path = require('path');
const fs = require('fs');

const isDev = !app.isPackaged;

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 640,
    autoHideMenuBar: true,
    icon: path.join(__dirname, '..', 'public', 'favicon.svg'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      webSecurity: true,
    },
  });

  if (isDev) {
    win.loadURL(process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173');
  } else {
    win.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

ipcMain.handle('dialog:saveResult', async (_evt, { filename, content, type }) => {
  const { canceled, filePath } = await dialog.showSaveDialog({
    defaultPath: path.join(app.getPath('documents'), '상호명초성퀴즈', filename),
    filters: type === 'csv'
      ? [{ name: 'CSV', extensions: ['csv'] }]
      : [{ name: 'JSON', extensions: ['json'] }],
  });
  if (canceled || !filePath) return { saved: false };
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf-8');
  return { saved: true, filePath };
});

// 퀴즈 편집 내용을 기본 데이터 파일(src/data/quizzes.json)에 영구 기록.
// 패키징된 빌드는 asar 내부라 읽기 전용이므로 건너뜀(렌더러가 localStorage 폴백 유지).
ipcMain.handle('quiz:savePool', async (_evt, json) => {
  if (app.isPackaged) {
    return { saved: false, reason: 'packaged-readonly' };
  }
  try {
    JSON.parse(json); // 손상 방지: 유효한 JSON인지 검증 후 기록
    const target = path.join(__dirname, '..', 'src', 'data', 'quizzes.json');
    fs.writeFileSync(target, json, 'utf-8');
    return { saved: true, filePath: target };
  } catch (e) {
    return { saved: false, reason: String(e) };
  }
});

app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
