import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { setupDatabase, getDatabase } from './database';

let mainWindow: BrowserWindow | null = null;

const createWindow = () => {
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 1280,
    minHeight: 800,
    title: '石油炼化生产调度与设备运维系统',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
};

app.whenReady().then(() => {
  setupDatabase();
  setupIpcHandlers();
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

function setupIpcHandlers() {
  const db = getDatabase();

  ipcMain.handle('db:find', async (_event, entity: string, options?: any) => {
    const repo = db.getRepository(entity);
    return repo.find(options || {});
  });

  ipcMain.handle('db:findOne', async (_event, entity: string, options?: any) => {
    const repo = db.getRepository(entity);
    return repo.findOne(options || {});
  });

  ipcMain.handle('db:save', async (_event, entity: string, data: any) => {
    const repo = db.getRepository(entity);
    return repo.save(data);
  });

  ipcMain.handle('db:remove', async (_event, entity: string, id: number) => {
    const repo = db.getRepository(entity);
    return repo.delete(id);
  });

  ipcMain.handle('db:query', async (_event, sql: string, params?: any[]) => {
    return db.query(sql, params);
  });

  ipcMain.handle('schedule:generate', async (_event, date: string) => {
    return generateSchedule(date);
  });
}

function generateSchedule(date: string) {
  return {
    success: true,
    message: '排产方案已生成',
    data: {}
  };
}
