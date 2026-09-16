const path = require('node:path');
const GAME_URL = 'app://mahjong/index.html';

function assetPath(value, root) {
  try {
    const url = new URL(value);
    if (url.protocol !== 'app:' || url.hostname !== 'mahjong' || url.port || url.username || url.password) return null;
    const pathname = decodeURIComponent(url.pathname);
    if (pathname.includes('\0') || pathname.includes('\\')) return null;
    const target = path.resolve(root, `.${pathname === '/' ? '/index.html' : pathname}`);
    const relative = path.relative(path.resolve(root), target);
    return relative && !relative.startsWith('..') && !path.isAbsolute(relative) ? target : null;
  } catch { return null; }
}

function isGameDocument(value) {
  try {
    const url = new URL(value);
    url.hash = '';
    return url.href === GAME_URL;
  } catch { return false; }
}

const windowOptions = {
  width: 1280, height: 860, minWidth: 800, minHeight: 600,
  title: '台灣麻將', backgroundColor: '#102c25', show: false,
  webPreferences: { sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true, devTools: false, webviewTag: false },
};
module.exports = { GAME_URL, assetPath, isGameDocument, windowOptions };
