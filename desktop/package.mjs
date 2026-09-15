import packager from '@electron/packager';
import { cp, mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
if (process.platform !== 'darwin') throw new Error('This local delivery targets macOS only.');
const metadata = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8'));
const electronVersion = createRequire(import.meta.url)('electron/package.json').version;
// Stage an explicit allowlist. Repository files and development dependencies never enter the app.
const stage = await mkdtemp(path.join(tmpdir(), 'mahjong-package-'));
await mkdir(path.join(stage, 'desktop'));
await cp(path.join(root, 'dist'), path.join(stage, 'dist'), { recursive: true });
for (const name of ['main.cjs', 'policy.cjs']) await cp(path.join(root, 'desktop', name), path.join(stage, 'desktop', name));
await writeFile(path.join(stage, 'package.json'), JSON.stringify({ name: metadata.name, version: metadata.version, productName: 'Taiwan Mahjong', main: 'desktop/main.cjs' }, null, 2));
const outputs = await packager({ dir: stage, out: path.join(root, 'release'), name: 'Taiwan Mahjong', executableName: 'Taiwan Mahjong', appBundleId: 'local.mahjong.desktop', platform: 'darwin', arch: process.arch, electronVersion, asar: true, prune: false, overwrite: false, osxSign: false, osxNotarize: false });
console.log(`Unsigned local macOS build (${process.arch}):\n${outputs.join('\n')}\nStaging directory: ${stage}`);
