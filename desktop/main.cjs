const { app, BrowserWindow, protocol, session, Menu, dialog } = require('electron');
const { readFile, realpath } = require('node:fs/promises');
const path = require('node:path');
const { GAME_URL, assetPath, isGameDocument, windowOptions } = require('./policy.cjs');

protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { standard: true, secure: true, supportFetchAPI: true } }]);
const types = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.woff2': 'font/woff2', '.ico': 'image/x-icon' };
const csp = "default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data:; font-src 'self'; connect-src 'none'; object-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";

app.whenReady().then(async () => {
  const root = await realpath(path.join(__dirname, '..', 'dist'));
  session.defaultSession.setPermissionRequestHandler((_contents, _permission, callback) => callback(false));
  session.defaultSession.setPermissionCheckHandler(() => false);
  session.defaultSession.on('will-download', event => event.preventDefault());
  session.defaultSession.webRequest.onBeforeRequest((details, callback) => {
    callback({ cancel: !assetPath(details.url, root) });
  });
  protocol.handle('app', async request => {
    const file = assetPath(request.url, root);
    if (!file || request.method !== 'GET') return new Response('Forbidden', { status: 403 });
    try {
      const canonical = await realpath(file);
      const relative = path.relative(root, canonical);
      if (relative.startsWith('..') || path.isAbsolute(relative)) return new Response('Forbidden', { status: 403 });
      return new Response(await readFile(canonical), { headers: { 'Content-Type': types[path.extname(canonical)] || 'application/octet-stream', 'Content-Security-Policy': csp, 'X-Content-Type-Options': 'nosniff' } });
    } catch { return new Response('Not found', { status: 404 }); }
  });
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    { label: '台灣麻將', submenu: [{ role: 'about' }, { type: 'separator' }, { role: 'quit' }] },
    { role: 'editMenu' }, { role: 'windowMenu' },
  ]));
  const window = new BrowserWindow(windowOptions);
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event, url) => { if (!isGameDocument(url)) event.preventDefault(); });
  window.webContents.on('will-redirect', event => event.preventDefault());
  window.webContents.on('will-attach-webview', event => event.preventDefault());
  window.once('ready-to-show', () => window.show());
  await window.loadURL(GAME_URL);
}).catch(error => {
  dialog.showErrorBox('無法啟動台灣麻將', `請先執行 npm run build，或重新建立桌面產物。\n${error.message}`);
  app.quit();
});
// Closing the only game window exits; no local server or child process is started.
app.on('window-all-closed', () => app.quit());
