import { readdir, readFile, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const sourceDirectories = [
    path.join(projectRoot, 'resources/js'),
    path.join(projectRoot, 'proprietary/resources/js'),
];
const outputDirectory = path.join(projectRoot, 'public/icons/iconify');
const manifestPath = path.join(
    projectRoot,
    'resources/js/Shared/UI/Icon/localIconNames.ts',
);
const supportedPrefixes = new Set(['logos', 'lucide', 'mdi', 'simple-icons']);
const sourceExtensions = new Set(['.js', '.jsx', '.ts', '.tsx']);
const iconPattern = /\b([a-z][a-z0-9-]*):([a-z0-9][a-z0-9-]*)\b/g;

async function collectSourceFiles(directory) {
    const entries = await readdir(directory, { withFileTypes: true });
    const files = [];

    for (const entry of entries) {
        const entryPath = path.join(directory, entry.name);

        if (entry.isDirectory()) {
            files.push(...await collectSourceFiles(entryPath));
        } else if (sourceExtensions.has(path.extname(entry.name))) {
            files.push(entryPath);
        }
    }

    return files;
}

async function collectIconNames() {
    const files = (await Promise.all(sourceDirectories.map(collectSourceFiles))).flat();
    const icons = new Set(['lucide:circle-help']);

    for (const file of files) {
        const source = await readFile(file, 'utf8');

        for (const match of source.matchAll(iconPattern)) {
            if (supportedPrefixes.has(match[1])) {
                icons.add(`${match[1]}:${match[2]}`);
            }
        }
    }

    return [...icons].sort();
}

function svgToSymbol(icon, svg) {
    const openingTag = svg.match(/^<svg([^>]*)>/);

    if (!openingTag || !svg.endsWith('</svg>')) {
        throw new Error(`Invalid SVG returned for ${icon}`);
    }

    const attributes = openingTag[1]
        .replace(/\s(?:height|width|xmlns)="[^"]*"/g, '');
    const content = svg.slice(openingTag[0].length, -6);
    const symbolId = icon.replace(':', '-');

    return `<symbol id="${symbolId}"${attributes}>${content}</symbol>`;
}

async function downloadIcon(icon) {
    const [prefix, name] = icon.split(':');
    const response = await globalThis.fetch(
        `https://api.iconify.design/${encodeURIComponent(prefix)}/${encodeURIComponent(name)}.svg`,
    );

    if (!response.ok) {
        throw new Error(`Unable to download ${icon}: HTTP ${response.status}`);
    }

    const svg = await response.text();
    const iconDirectory = path.join(outputDirectory, prefix);
    await mkdir(iconDirectory, { recursive: true });
    await writeFile(path.join(iconDirectory, `${name}.svg`), `${svg}\n`);

    return svgToSymbol(icon, svg);
}

const icons = await collectIconNames();
const symbols = [];

for (let index = 0; index < icons.length; index += 20) {
    const iconBatch = icons.slice(index, index + 20);
    symbols.push(...await Promise.all(iconBatch.map(downloadIcon)));
}

await mkdir(outputDirectory, { recursive: true });
await writeFile(
    path.join(outputDirectory, 'sprite.svg'),
    `<svg xmlns="http://www.w3.org/2000/svg">${symbols.join('')}</svg>\n`,
);
await writeFile(
    manifestPath,
    `export const localIconNames = new Set<string>(${JSON.stringify(icons, null, 4)});\n`,
);

console.log(`Downloaded ${icons.length} local Iconify SVGs.`);
