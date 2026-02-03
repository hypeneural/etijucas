#!/usr/bin/env node
/**
 * generate-mocks.js
 *
 * Generates MSW handlers from contracts/openapi.yaml.
 * Output: apps/web/src/mocks/handlers.generated.ts
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const ROOT = path.join(__dirname, '..');
const OPENAPI_PATH = path.join(ROOT, 'contracts', 'openapi.yaml');
const OUTPUT_PATH = path.join(ROOT, 'apps', 'web', 'src', 'mocks', 'handlers.generated.ts');

const HTTP_METHODS = ['get', 'post', 'put', 'patch', 'delete'];

function toMswPath(openapiPath) {
    return openapiPath.replace(/\{([^}]+)\}/g, ':$1');
}

function buildHandler(method, pathTemplate) {
    const mswPath = toMswPath(pathTemplate);
    const handlerName = `${method.toUpperCase()} ${pathTemplate}`;

    const response = method === 'get'
        ? "HttpResponse.json({ data: [], success: true })"
        : "HttpResponse.json({ success: true })";

    return `  // ${handlerName}\n  http.${method}('${mswPath}', () => ${response}),`;
}

function main() {
    if (!fs.existsSync(OPENAPI_PATH)) {
        console.error('OpenAPI spec not found at:', OPENAPI_PATH);
        process.exit(1);
    }

    const raw = fs.readFileSync(OPENAPI_PATH, 'utf8');
    const spec = yaml.parse(raw) || {};
    const paths = spec.paths || {};

    const lines = [];
    lines.push("import { http, HttpResponse } from 'msw';");
    lines.push('');
    lines.push('/**');
    lines.push(' * AUTO-GENERATED FILE. DO NOT EDIT.');
    lines.push(' * Run `pnpm mocks:gen` to regenerate.');
    lines.push(' */');
    lines.push('export const generatedHandlers = [');

    for (const [route, methods] of Object.entries(paths)) {
        for (const method of Object.keys(methods)) {
            const normalized = method.toLowerCase();
            if (!HTTP_METHODS.includes(normalized)) {
                continue;
            }
            lines.push(buildHandler(normalized, route));
        }
    }

    lines.push('];');
    lines.push('');

    fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
    fs.writeFileSync(OUTPUT_PATH, lines.join('\n'));
    console.log('✅ Generated MSW handlers at:', OUTPUT_PATH);
}

main();
