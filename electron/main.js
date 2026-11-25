const { app, BrowserWindow, Tray, Menu, nativeImage, ipcMain, Notification } = require('electron');
const path = require('path');
const http = require('http');
const fs = require('fs');

app.setName('Mumu');
try {
  const userDataPath = path.join(app.getPath('appData'), 'MumuApp');
  if (!fs.existsSync(userDataPath)) {
    fs.mkdirSync(userDataPath, { recursive: true });
  }
  app.setPath('userData', userDataPath);
} catch (_) {}

const APP_ID = 'com.meutempo.mumu';
app.setAppUserModelId(APP_ID);

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ttf': 'font/ttf',
  '.map': 'application/json',
};

function startServer(distPath) {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      try {
        const parsedUrl = new URL(req.url, 'http://127.0.0.1');
        let safePath = decodeURIComponent(parsedUrl.pathname);
        if (safePath === '/' || safePath === '') safePath = '/index.html';

        let targetPath = path.normalize(path.join(distPath, safePath));

        if (!targetPath.startsWith(distPath)) {
          res.writeHead(403);
          res.end('Acesso negado');
          return;
        }

        if (fs.existsSync(targetPath) && fs.statSync(targetPath).isDirectory()) {
          targetPath = path.join(targetPath, 'index.html');
        }

        if (!fs.existsSync(targetPath)) {
          targetPath = path.join(distPath, 'index.html');
        }

        const ext = path.extname(targetPath).toLowerCase();
        const contentType = MIME_TYPES[ext] || 'application/octet-stream';

        const content = fs.readFileSync(targetPath);
        res.writeHead(200, {
          'Content-Type': contentType,
          'Cache-Control': 'no-cache',
        });
        res.end(content);
      } catch (err) {
        res.writeHead(500);
        res.end('Erro interno: ' + err.message);
      }
    });

    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolve({ server, port });
    });

    server.on('error', reject);
  });
}

let mainWindow = null;
let tray = null;
let isQuitting = false;
let staticServer = null;

const gotTheLock = app.requestSingleInstanceLock();

if (!gotTheLock) {
  app.quit();
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.show();
      mainWindow.focus();
    }
  });

  app.whenReady().then(async () => {
    const distPath = path.resolve(__dirname, '..', 'dist');
    const iconPath = path.resolve(__dirname, '..', 'assets', 'icon.png');

    try {
      const { server, port } = await startServer(distPath);
      staticServer = server;

      createWindow(port, iconPath);
      createTray(iconPath);
    } catch (err) {
      console.error('Falha ao iniciar servidor estático:', err);
    }

    app.on('activate', () => {
      if (BrowserWindow.getAllWindows().length === 0) {
        if (staticServer) {
          const port = staticServer.address().port;
          createWindow(port, iconPath);
        }
      } else if (mainWindow) {
        mainWindow.show();
      }
    });
  });

  app.on('before-quit', () => {
    isQuitting = true;
    if (staticServer) {
      try { staticServer.close(); } catch (_) {}
    }
  });
}

function createWindow(port, iconPath) {
  mainWindow = new BrowserWindow({
    width: 480,
    height: 820,
    minWidth: 380,
    minHeight: 600,
    title: 'Mumu',
    icon: iconPath,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
    },
  });

  mainWindow.setMenuBarVisibility(false);
  mainWindow.loadURL(`http://127.0.0.1:${port}`);

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray(iconPath) {
  try {
    const nImage = nativeImage.createFromPath(iconPath);
    const trayIcon = nImage.resize({ width: 16, height: 16 });
    tray = new Tray(trayIcon);
    tray.setToolTip('Mumu - Rotina Familiar');

    const updateMenu = () => {
      const isAutoStart = app.getLoginItemSettings().openAtLogin;
      const contextMenu = Menu.buildFromTemplate([
        {
          label: 'Abrir Mumu',
          click: () => {
            if (mainWindow) {
              mainWindow.show();
              mainWindow.focus();
            }
          },
        },
        {
          label: 'Iniciar com o Windows',
          type: 'checkbox',
          checked: isAutoStart,
          click: (item) => {
            app.setLoginItemSettings({
              openAtLogin: item.checked,
              openAsHidden: true,
            });
            updateMenu();
          },
        },
        { type: 'separator' },
        {
          label: 'Sair do Mumu',
          click: () => {
            isQuitting = true;
            app.quit();
          },
        },
      ]);
      tray.setContextMenu(contextMenu);
    };

    updateMenu();

    tray.on('double-click', () => {
      if (mainWindow) {
        mainWindow.show();
        mainWindow.focus();
      }
    });
  } catch (err) {
    console.warn('Bandeja do sistema não pôde ser iniciada:', err);
  }
}

ipcMain.on('notify', (_, { title, body }) => {
  try {
    if (Notification.isSupported()) {
      const iconPath = path.resolve(__dirname, '..', 'assets', 'icon.png');
      new Notification({
        title: title || 'Mumu',
        body: body || '',
        icon: iconPath,
      }).show();
    }
  } catch (err) {
    console.warn('Erro ao emitir notificação:', err);
  }
});
