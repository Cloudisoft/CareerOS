/**
 * Publish GitHub-built CareerOS Companion installers to the private Railway S3 bucket.
 * Uses short-lived GitHub OIDC identity, never a hardcoded secret or public release URL.
 * This script runs ONLY for push commits on the protected main branch.
 */
import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const dest = 'https://careeros.silverspringstaffing.com/api/internal/downloads/github-release';
const dir = path.resolve('dist');
const requestUrl = process.env.ACTIONS_ID_TOKEN_REQUEST_URL;
const requestToken = process.env.ACTIONS_ID_TOKEN_REQUEST_TOKEN;
if (!requestUrl || !requestToken || process.env.GITHUB_REF !== 'refs/heads/main' ||
    process.env.GITHUB_REPOSITORY !== 'Cloudisoft/CareerOS' || process.env.GITHUB_EVENT_NAME !== 'push') {
  throw new Error('Release publishing requires an authorized main-branch GitHub Actions run.');
}

const oidcResponse = await fetch(requestUrl + (requestUrl.includes('?') ? '&' : '?') + 'audience=careeros-companion-release-v1', {
  headers: { Authorization: 'Bearer ' + requestToken },
  signal: AbortSignal.timeout(15000),
});
if (!oidcResponse.ok) throw new Error('Could not obtain short-lived GitHub release identity.');
const token = (await oidcResponse.json()).value;
if (!token || typeof token !== 'string') throw new Error('No GitHub OIDC identity was returned.');

const files = await readdir(dir);
function targetFilename(predicate, label) {
  const matches = files.filter(predicate);
  if (matches.length !== 1) throw new Error(`Expected one ${label} installer, got ${matches.length}.`);
  return matches[0];
}

const targets = process.platform === 'darwin'
  ? [
      { platform: 'mac', file: targetFilename(name => name.endsWith('-arm64.dmg'), 'Apple Silicon') },
      { platform: 'mac-intel', file: targetFilename(name => name.endsWith('.dmg') && !name.endsWith('-arm64.dmg'), 'Intel Mac') },
    ]
  : process.platform === 'win32'
    ? [{ platform: 'windows', file: targetFilename(name => name.endsWith('.exe') && name.includes('Setup') && !name.includes('uninstaller'), 'Windows') }]
    : [];

if (!targets.length) throw new Error('Unsupported release builder OS.');

for (const target of targets) {
  const signedResponse = await fetch(dest, {
    method: 'POST',
    headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json' },
    body: JSON.stringify({ platform: target.platform }),
    signal: AbortSignal.timeout(20000),
  });
  if (!signedResponse.ok) throw new Error(`Private upload authorization rejected for ${target.platform}: HTTP ${signedResponse.status}`);
  const response = await signedResponse.json();
  if (!response.url || !response.url.startsWith('https://')) throw new Error('Release API returned no valid upload URL.');
  const bytes = await readFile(path.join(dir, target.file));
  const upload = await fetch(response.url, {
    method: 'PUT',
    body: bytes,
    signal: AbortSignal.timeout(180000),
  });
  if (!upload.ok) throw new Error(`Private Railway bucket upload failed for ${target.platform}: HTTP ${upload.status}`);
  console.log(`Private release uploaded: ${target.platform}, ${target.file}, ${bytes.length} bytes, ETag: ${upload.headers.get('etag') || 'not provided'}`);
}
