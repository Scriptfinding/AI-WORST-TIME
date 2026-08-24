// Builds src/sandbox/run-header.js by concatenating the ordered fragments in
// src/runtime/. The generated artifact is committed: PHP copies it into the run
// sandbox and the frontend imports it with ?raw for the editor help catalog, so
// it must stay a plain, flat JS file. Edit the fragments, then run: npm run build:runtime
//
// The output is not a standalone module: run.js injects it inside an async
// IIFE (after run-guard.js, before user code) where $page, $browser and
// $puppeteer are in scope, then evaluates the whole script.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const runtimeDir = path.join(root, 'src', 'runtime');
const outputPath = path.join(root, 'src', 'sandbox', 'run-header.js');

const BANNER = '// GENERATED FILE - built from src/runtime/ fragments by scripts/build-runtime.mjs.\n' +
  '// Do not edit directly: edit the fragments and run "npm run build:runtime".\n\n';

const fragments = fs.readdirSync(runtimeDir)
  .filter((name) => name.endsWith('.js'))
  .sort();

if (fragments.length === 0) {
  console.error(`No fragments found in ${runtimeDir}`);
  process.exit(1);
}

let output = BANNER;
for (const name of fragments) {
  output += fs.readFileSync(path.join(runtimeDir, name), 'utf8');
}

const checkMode = process.argv.includes('--check');
if (checkMode) {
  const current = fs.existsSync(outputPath) ? fs.readFileSync(outputPath, 'utf8') : '';
  if (current !== output) {
    console.error('src/sandbox/run-header.js is stale: run "npm run build:runtime" and commit the result.');
    process.exit(1);
  }
  console.log('src/sandbox/run-header.js is up to date.');
} else {
  fs.writeFileSync(outputPath, output);
  console.log(`Wrote ${outputPath} (${output.length} bytes, ${fragments.length} fragments)`);
}
