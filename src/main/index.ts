import { app, BrowserWindow, ipcMain, dialog } from 'electron';
import * as path from 'path';
import * as fs from 'fs';

let mainWindow: BrowserWindow | null = null;

// ウィンドウ生成
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1024,
    height: 768,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'), // セキュリティを保ちつつメインと通信
      nodeIntegration: false,
      contextIsolation: true,
    },
    title: "Frisk-Emulator",
  });

  // 開発時は Vite のポート、本番は build された index.html を読み込む
  const startUrl = process.env.NODE_ENV === 'development' 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../renderer/index.html')}`;

  mainWindow.loadURL(startUrl);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// --- ROM 読み込みロジック (ここが本気) ---

ipcMain.handle('load-rom', async () => {
  // 1. まず実行ファイル階層の loading/default.bin を探す
  const defaultPath = path.join(app.getAppPath(), 'loading', 'default.bin');

  if (fs.existsSync(defaultPath)) {
    console.log('Found default.bin, loading...');
    const buffer = fs.readFileSync(defaultPath);
    return new Uint8Array(buffer);
  }

  // 2. なければダイアログを出してユーザーに選択させる
  console.log('default.bin not found. Opening file picker...');
  const { canceled, filePaths } = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Frisk ROM', extensions: ['bin'] }]
  });

  if (canceled || filePaths.length === 0) {
    return null;
  }

  const buffer = fs.readFileSync(filePaths[0]);
  return new Uint8Array(buffer);
});

// アプリのライフサイクル
app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});
