#!/usr/bin/env node
/**
 * sync-msw-worker.js
 *
 * Copies the MSW service worker file from node_modules into apps/web/public.
 * Run after installing dependencies:
 *   pnpm install
 *   pnpm msw:init
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const WEB_ROOT = path.join(ROOT, 'apps', 'web');
const DEST = path.join(WEB_ROOT, 'public', 'mockServiceWorker.js');

function resolveWorkerPath() {
    const localPaths = [
        path.join(WEB_ROOT, 'node_modules', 'msw', 'lib', 'mockServiceWorker.js'),
        path.join(ROOT, 'node_modules', 'msw', 'lib', 'mockServiceWorker.js'),
    ];

    for (const candidate of localPaths) {
        if (fs.existsSync(candidate)) {
            return candidate;
        }
    }

    try {
        // eslint-disable-next-line global-require
        return require.resolve('msw/lib/mockServiceWorker.js', { paths: [WEB_ROOT, ROOT] });
    } catch (error) {
        return null;
    }
}

function main() {
    const source = resolveWorkerPath();
    if (!source) {
        console.error('❌ Could not find MSW mockServiceWorker.js. Install dependencies first.');
        process.exit(1);
    }

    fs.mkdirSync(path.dirname(DEST), { recursive: true });
    fs.copyFileSync(source, DEST);
    console.log('✅ MSW worker copied to:', DEST);
}

main();
