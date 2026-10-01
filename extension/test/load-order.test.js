// @vitest-environment jsdom
//
// Loads every script the content-script registration injects, in the same
// order (read straight from lib/permissions.js), and checks each library
// actually attached itself to window.CareerOS. lib/flows.js once ended with
// `})();` instead of passing the global in, threw on load, and left every
// Easy Apply / Next / Submit / auto-scroll path calling an undefined Flows —
// with no test noticing. This is that test.
import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const EXT_DIR = path.resolve(__dirname, '..');

function injectedScripts() {
  const src = fs.readFileSync(path.join(EXT_DIR, 'lib/permissions.js'), 'utf8');
  const block = src.slice(src.indexOf('js: ['), src.indexOf('],', src.indexOf('js: [')));
  return [...block.matchAll(/'([^']+\.js)'/g)].map((m) => m[1]);
}

const EXPECTED = {
  'lib/storage.js': 'Storage',
  'lib/profile.js': 'Profile',
  'lib/ats.js': 'ATS',
  'lib/matcher.js': 'Matcher',
  'lib/policy.js': 'Policy',
  'lib/careeros-api.js': 'Api',
  'lib/flows.js': 'Flows',
  'lib/harvest.js': 'Harvest',
  'lib/filler.js': 'Filler',
  'lib/coach.js': 'Coach',
};

describe('content-script libraries', () => {
  it('every injected library loads and registers itself on window.CareerOS', () => {
    // Minimal chrome stub: some libraries read chrome.* at call time, not load time.
    globalThis.chrome = { runtime: { getManifest: () => ({ version: 'test' }) }, storage: { local: {} } };
    const scripts = injectedScripts();
    expect(scripts).toContain('content/careeros.js');

    for (const rel of scripts) {
      if (rel.startsWith('content/')) continue;
      const code = fs.readFileSync(path.join(EXT_DIR, rel), 'utf8');
      expect(() => (0, eval)(code), `${rel} threw while loading`).not.toThrow();
      const name = EXPECTED[rel];
      if (name) expect(window.CareerOS && window.CareerOS[name], `${rel} did not register CareerOS.${name}`).toBeTruthy();
    }
    expect(typeof window.CareerOS.Flows.press).toBe('function');
    expect(typeof window.CareerOS.Coach.start).toBe('function');
  });
});
