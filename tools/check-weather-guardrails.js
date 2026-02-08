#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const REQUIRED_FILES = [
    'WEATHER_MULTI_TENANCY_ANALISE_COMPLETA.md',
    'WEATHER_TASKS_EXECUCAO_PR.md',
    'WEATHER_PR_CHECKLIST.md',
    'WEATHER_CACHE_KEYS_PADRAO.md',
    'WEATHER_BUNDLE_CONTRACT_V2.md',
];

const REQUIRED_PATTERNS = [
    {
        file: 'WEATHER_MULTI_TENANCY_ANALISE_COMPLETA.md',
        pattern: 'contract_version',
        label: 'bundle contract version',
    },
    {
        file: 'WEATHER_MULTI_TENANCY_ANALISE_COMPLETA.md',
        pattern: 'weather:bundle:{citySlug}',
        label: 'cache key pattern',
    },
    {
        file: 'WEATHER_TASKS_EXECUCAO_PR.md',
        pattern: 'UTF-8 sem BOM',
        label: 'encoding requirement',
    },
    {
        file: 'WEATHER_TASKS_EXECUCAO_PR.md',
        pattern: 'PR-WTH-000',
        label: 'execution plan sequence',
    },
];

function absolute(relPath) {
    return path.join(ROOT, relPath);
}

function fileExists(relPath) {
    return fs.existsSync(absolute(relPath));
}

function hasUtf8Bom(relPath) {
    const filePath = absolute(relPath);
    const buffer = fs.readFileSync(filePath);
    return (
        buffer.length >= 3 &&
        buffer[0] === 0xef &&
        buffer[1] === 0xbb &&
        buffer[2] === 0xbf
    );
}

function main() {
    const errors = [];

    for (const relPath of REQUIRED_FILES) {
        if (!fileExists(relPath)) {
            errors.push(`missing required file: ${relPath}`);
            continue;
        }

        if (hasUtf8Bom(relPath)) {
            errors.push(`UTF-8 BOM not allowed: ${relPath}`);
        }
    }

    for (const rule of REQUIRED_PATTERNS) {
        if (!fileExists(rule.file)) {
            continue;
        }

        const content = fs.readFileSync(absolute(rule.file), 'utf8');
        if (!content.includes(rule.pattern)) {
            errors.push(
                `missing "${rule.label}" (${rule.pattern}) in ${rule.file}`
            );
        }
    }

    if (errors.length > 0) {
        console.error('Weather guardrails check failed:');
        for (const item of errors) {
            console.error(`  - ${item}`);
        }
        process.exit(1);
    }

    console.log('Weather guardrails check passed.');
    console.log(`Required files checked: ${REQUIRED_FILES.length}`);
    console.log(`Required patterns checked: ${REQUIRED_PATTERNS.length}`);
}

main();

