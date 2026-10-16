// node scripts/build.mjs --target chrome|firefox|safari [--base https://www.tholafind.com] [--dev] [--test]
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const opt = (n, d) => { const i = args.indexOf(`--${n}`); return i >= 0 ? args[i + 1] : d; };
const flag = (n) => args.includes(`--${n}`);

const target = opt('target', 'chrome');
if (!['chrome', 'firefox', 'safari'].includes(target)) throw new Error('--target must be chrome, firefox or safari');
const base = opt('base', 'https://www.tholafind.com').replace(/\/+$/, '');
const test = flag('test');
const out = path.join(root, 'dist', target + (test ? '-test' : ''));

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(path.join(root, 'src'), out, { recursive: true });
fs.rmSync(path.join(out, 'manifest.base.json'));
if (fs.existsSync(path.join(root, 'vendor'))) fs.cpSync(path.join(root, 'vendor'), path.join(out, 'vendor'), { recursive: true });
else console.warn('! vendor/ missing: on-device OCR will be skipped (run `npm run vendor`). Hunts still work via server OCR.');

// config
const cfgPath = path.join(out, 'lib', 'config.js');
fs.writeFileSync(cfgPath, fs.readFileSync(cfgPath, 'utf8').replace('__API_BASE__', base).replace('TEST_BUILD = false', `TEST_BUILD = ${test}`));

// manifest
const m = JSON.parse(fs.readFileSync(path.join(root, 'src', 'manifest.base.json'), 'utf8').replaceAll('__API_ORIGIN__', base));
if (flag('dev') && !base.startsWith('http://localhost')) throw new Error('--dev expects a localhost --base');
if (test) m.host_permissions.push('<all_urls>');

if (target === 'chrome') {
  m.permissions.push('offscreen');
  m.background = { service_worker: 'background.js', type: 'module' };
} else {
  m.background = { scripts: ['background.js'], type: 'module' };
  if (target === 'firefox') {
    // data_collection_permissions is mandatory for new AMO submissions and needs Firefox 140+.
    // Declared because a hunt sends: the image + text read from it (websiteContent), the page's
    // hostname (browsingActivity) and the account token (authenticationInfo).
    m.browser_specific_settings = {
      gecko: {
        id: 'tholafind@tholafind.com',
        strict_min_version: '140.0',
        data_collection_permissions: { required: ['websiteContent', 'browsingActivity', 'authenticationInfo'] },
      },
    };
  }
}
if (flag('dev')) m.name += ' (dev)';
fs.writeFileSync(path.join(out, 'manifest.json'), JSON.stringify(m, null, 2));
console.log(`built ${path.relative(root, out)} -> ${base}`);
