#!/usr/bin/env node

/**
 * check-features-map.js
 * 
 * Valida que features.yaml está sincronizado com:
 * - apps/web/src/features/<name>/ existe
 * - apps/api/app/Domains/<Name>/ existe
 * - endpoints existem no openapi.yaml
 * 
 * Usage: pnpm check:features
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const FEATURES_PATH = path.join(__dirname, '../contracts/features.yaml');
const OPENAPI_PATH = path.join(__dirname, '../contracts/openapi.yaml');
const FRONTEND_FEATURES = path.join(__dirname, '../apps/web/src/features');
const BACKEND_DOMAINS = path.join(__dirname, '../apps/api/app/Domains');

// Domains that should have backend folder (features with tables or write permissions)
const BACKEND_FEATURES = ['auth', 'forum', 'events', 'reports'];

function loadYaml(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    return yaml.parse(fs.readFileSync(filePath, 'utf8'));
}

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function main() {
    console.log('🔍 Validating features map...\n');

    const errors = [];
    const warnings = [];

    // Load features.yaml
    const featuresData = loadYaml(FEATURES_PATH);
    if (!featuresData) {
        console.log('❌ contracts/features.yaml not found');
        process.exit(1);
    }

    const features = featuresData.features || {};

    // Load OpenAPI (optional check)
    const openapi = loadYaml(OPENAPI_PATH);
    const openapiPaths = openapi?.paths ? Object.keys(openapi.paths) : [];

    for (const [name, config] of Object.entries(features)) {
        console.log(`  Checking: ${name}`);

        // 1. Check frontend feature folder exists
        const frontendPath = path.join(FRONTEND_FEATURES, name);
        if (!fs.existsSync(frontendPath)) {
            if (config.screens && config.screens.length > 0) {
                errors.push(`Frontend folder missing: apps/web/src/features/${name}/`);
            } else {
                warnings.push(`No frontend folder for ${name} (no screens defined)`);
            }
        }

        // 2. Check backend domain folder exists (for features with backend logic)
        if (BACKEND_FEATURES.includes(name)) {
            const backendPath = path.join(BACKEND_DOMAINS, capitalize(name));
            if (!fs.existsSync(backendPath)) {
                warnings.push(`Backend domain suggested: apps/api/app/Domains/${capitalize(name)}/`);
            }
        }

        // 3. Check API endpoints exist in OpenAPI (if OpenAPI has paths)
        if (openapiPaths.length > 0 && config.api) {
            for (const endpoint of config.api) {
                // Extract path from "METHOD /path"
                const parts = endpoint.split(' ');
                if (parts.length >= 2) {
                    const apiPath = parts[1];
                    // Normalize path (remove params like {id})
                    const normalizedPath = apiPath.replace(/\{[^}]+\}/g, '{param}');

                    const found = openapiPaths.some(p => {
                        const normalizedOpenapi = p.replace(/\{[^}]+\}/g, '{param}');
                        return normalizedOpenapi === normalizedPath;
                    });

                    if (!found) {
                        warnings.push(`Endpoint not in OpenAPI: ${endpoint}`);
                    }
                }
            }
        }
    }

    // Print results
    console.log('');

    if (errors.length > 0) {
        console.log('❌ Errors:');
        errors.forEach(e => console.log(`   - ${e}`));
    }

    if (warnings.length > 0) {
        console.log('⚠️  Warnings:');
        warnings.forEach(w => console.log(`   - ${w}`));
    }

    if (errors.length === 0 && warnings.length === 0) {
        console.log('✅ All features are properly mapped!');
    } else if (errors.length === 0) {
        console.log('\n✅ No critical errors (warnings are suggestions)');
    }

    // Exit with error if critical errors
    process.exit(errors.length > 0 ? 1 : 0);
}

main();
