#!/usr/bin/env node
/**
 * Contract Check Script
 * 
 * Validates that frontend API config matches OpenAPI spec.
 * Run: node tools/contract-check/check-endpoints.mjs
 */

import { readFileSync } from 'fs';
import { parse } from 'yaml';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, '../..');

// ============================================================
// CONFIGURATION
// ============================================================

const CONFIG_PATH = join(ROOT_DIR, 'apps/web/src/api/config.ts');
const OPENAPI_PATH = join(ROOT_DIR, 'contracts/openapi.yaml');

const ENDPOINTS_TO_CHECK = [
    { name: 'myReports', frontendKey: 'reports.myReports', openapiPath: '/api/v1/reports/me' },
    { name: 'publicReports', frontendKey: 'reports.all', openapiPath: '/api/v1/reports' },
    { name: 'reportStats', frontendKey: 'reports.stats', openapiPath: '/api/v1/reports/stats' },
    { name: 'categories', frontendKey: 'reports.categories', openapiPath: '/api/v1/reports/categories' },
];

// ============================================================
// HELPERS
// ============================================================

function extractEndpointFromConfig(content, pathKey) {
    // Match patterns like: myReports: '/reports/me' or all: '/reports'
    const keys = pathKey.split('.');
    const lastKey = keys[keys.length - 1];

    // Try to find the endpoint value
    const patterns = [
        new RegExp(`${lastKey}:\\s*['"\`]([^'"\`]+)['"\`]`, 'm'),
        new RegExp(`'${lastKey}':\\s*['"\`]([^'"\`]+)['"\`]`, 'm'),
    ];

    for (const pattern of patterns) {
        const match = content.match(pattern);
        if (match) {
            return match[1];
        }
    }

    return null;
}

function checkPathInOpenAPI(openapiContent, path) {
    try {
        const spec = parse(openapiContent);
        const paths = spec.paths || {};

        // Normalize path (OpenAPI might have it with or without /api/v1 prefix)
        const normalizedPath = path.replace(/^\/api\/v1/, '');
        const fullPath = `/api/v1${normalizedPath}`;

        return paths[path] || paths[fullPath] || paths[normalizedPath];
    } catch (error) {
        console.error('Error parsing OpenAPI spec:', error.message);
        return null;
    }
}

// ============================================================
// MAIN
// ============================================================

console.log('🔍 Contract Check: Frontend API Config vs OpenAPI Spec\n');

let configContent, openapiContent;

try {
    configContent = readFileSync(CONFIG_PATH, 'utf-8');
} catch (error) {
    console.error(`❌ Failed to read frontend config: ${CONFIG_PATH}`);
    console.error(error.message);
    process.exit(1);
}

try {
    openapiContent = readFileSync(OPENAPI_PATH, 'utf-8');
} catch (error) {
    console.error(`❌ Failed to read OpenAPI spec: ${OPENAPI_PATH}`);
    console.error(error.message);
    process.exit(1);
}

let hasErrors = false;

for (const endpoint of ENDPOINTS_TO_CHECK) {
    const frontendPath = extractEndpointFromConfig(configContent, endpoint.frontendKey);
    const openapiExists = checkPathInOpenAPI(openapiContent, endpoint.openapiPath);

    const fullFrontendPath = frontendPath ? `/api/v1${frontendPath}` : null;
    const matches = fullFrontendPath === endpoint.openapiPath;

    if (!frontendPath) {
        console.log(`⚠️  ${endpoint.name}: Not found in frontend config`);
    } else if (!openapiExists) {
        console.log(`❌ ${endpoint.name}: Path "${endpoint.openapiPath}" not in OpenAPI spec`);
        hasErrors = true;
    } else if (!matches) {
        console.log(`❌ ${endpoint.name}: Mismatch`);
        console.log(`   Frontend: ${fullFrontendPath}`);
        console.log(`   OpenAPI:  ${endpoint.openapiPath}`);
        hasErrors = true;
    } else {
        console.log(`✅ ${endpoint.name}: ${endpoint.openapiPath}`);
    }
}

console.log('');

if (hasErrors) {
    console.log('❌ Contract check FAILED - Fix the mismatches above');
    process.exit(1);
} else {
    console.log('✅ Contract check PASSED');
    process.exit(0);
}
