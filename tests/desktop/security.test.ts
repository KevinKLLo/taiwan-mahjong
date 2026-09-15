import { describe, expect, it } from 'vitest';
import policy from '../../desktop/policy.cjs';

describe('desktop-runtime: 不可信導覽', () => {
  it('只提供 app://mahjong 的內附前端資源', () => {
    expect(policy.assetPath('app://mahjong/', '/app/dist')).toBe('/app/dist/index.html');
    expect(policy.assetPath('app://mahjong/assets/index.js', '/app/dist')).toBe('/app/dist/assets/index.js');
    for (const url of ['https://example.com/', 'file:///etc/passwd', 'app://other/index.html', 'app://mahjong/%2e%2e%2fsecret', 'app://mahjong/%00', 'app://user@mahjong/index.html']) {
      expect(policy.assetPath(url, '/app/dist')).toBeNull();
    }
  });
  it('僅允許開局文件導覽，renderer 啟用隔離與 sandbox', () => {
    expect(policy.isGameDocument('app://mahjong/index.html')).toBe(true);
    expect(policy.isGameDocument('https://example.com')).toBe(false);
    expect(policy.isGameDocument('app://mahjong/assets/code.js')).toBe(false);
    expect(policy.windowOptions.webPreferences).toMatchObject({sandbox: true, contextIsolation: true, nodeIntegration: false, webSecurity: true});
    expect(policy.windowOptions.webPreferences.preload).toBeUndefined();
    expect(policy.windowOptions.minWidth).toBe(800);
    expect(policy.windowOptions.minHeight).toBe(600);
  });
});
