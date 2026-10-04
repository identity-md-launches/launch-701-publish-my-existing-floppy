import assert from 'node:assert/strict';
import { readFile, readdir, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';

// Checks the delivered export, not the unavailable game or backend.
const root = resolve('dist');
const html = await readFile(join(root, 'index.html'), 'utf8');
const urls = [...html.matchAll(/(?:src|href)="([^"]+)"/g)].map((match) => match[1]);
assert(urls.length > 0, 'Export must contain bundled runtime assets');
for (const url of urls) {
  assert(url.startsWith('./'), `Expected a relative asset URL: ${url}`);
  assert(!url.includes('..'), `Asset must remain inside dist: ${url}`);
  assert((await stat(join(root, url))).isFile(), `Missing asset: ${url}`);
}
async function inspect(directory) {
  let bytes = 0;
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    assert(!entry.isSymbolicLink(), `Symlink in export: ${entry.name}`);
    assert(!['node_modules', '.cache', '.git', '.env'].includes(entry.name));
    assert(!/\.(?:map|tgz|zip)$/.test(entry.name), `Packaging artifact: ${entry.name}`);
    const path = join(directory, entry.name);
    bytes += entry.isDirectory() ? await inspect(path) : (await stat(path)).size;
  }
  return bytes;
}
const bytes = await inspect(root);
assert(bytes < 8_388_608, 'Export exceeds the full submission budget');
console.log(JSON.stringify({ export: 'pass', relativeAssets: urls, exportBytes: bytes }, null, 2));
