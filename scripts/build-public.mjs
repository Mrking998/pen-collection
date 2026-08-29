import { cp, mkdir, readdir, rm } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const rootUrl = new URL('../', import.meta.url);
const publicUrl = new URL('../public/', import.meta.url);
const root = fileURLToPath(rootUrl);
const publicDir = fileURLToPath(publicUrl);
const staticExtensions = new Set(['.html', '.xml', '.txt', '.ico', '.png']);

await rm(publicDir, { recursive: true, force: true });
await mkdir(publicDir, { recursive: true });

for (const entry of await readdir(root, { withFileTypes: true })) {
  if (!entry.isFile()) continue;
  const extension = entry.name.slice(entry.name.lastIndexOf('.'));
  if (staticExtensions.has(extension)) {
    await cp(join(root, entry.name), join(publicDir, entry.name));
  }
}

await cp(fileURLToPath(new URL('../assets/', import.meta.url)), fileURLToPath(new URL('../public/assets/', import.meta.url)), {
  recursive: true,
});
