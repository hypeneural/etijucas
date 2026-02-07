#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const BASELINE_PATH = path.join(__dirname, 'tenancy-guardrails-baseline.json');

const IGNORED_DIRS = new Set([
    '.git',
    'node_modules',
    'vendor',
    'storage',
    '_appdata',
]);

const TEXT_EXTENSIONS = new Set([
    '.php',
    '.js',
    '.mjs',
    '.cjs',
    '.ts',
    '.tsx',
    '.json',
    '.md',
    '.txt',
    '.yaml',
    '.yml',
    '.xml',
    '.css',
    '.scss',
    '.html',
    '.env',
    '.ini',
    '.lock',
]);

const EXTRA_TEXT_FILENAMES = new Set([
    'Dockerfile',
    '.gitignore',
    '.editorconfig',
    '.npmrc',
]);

const CACHE_TARGET_DIRS = [
    'apps/api/app/Domains',
    'apps/api/app/Http/Controllers/Api',
    'apps/api/app/Services',
];

const CACHE_ALLOWLIST = new Set([
    'apps/api/app/Services/CepLookupService.php',
    'apps/api/app/Services/OtpService.php',
    'apps/api/app/Services/ModuleService.php',
]);

function toPosix(input) {
    return input.replace(/\\/g, '/');
}

function rel(filePath) {
    return toPosix(path.relative(ROOT, filePath));
}

function isIgnoredDir(dirPath) {
    const relative = rel(dirPath);
    return relative
        .split('/')
        .some((part) => IGNORED_DIRS.has(part));
}

function walkFiles(dirPath, collector) {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const absolute = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (isIgnoredDir(absolute)) {
                continue;
            }
            walkFiles(absolute, collector);
            continue;
        }
        collector(absolute);
    }
}

function isTextFile(filePath) {
    const base = path.basename(filePath);
    if (EXTRA_TEXT_FILENAMES.has(base)) {
        return true;
    }

    const ext = path.extname(base).toLowerCase();
    return TEXT_EXTENSIONS.has(ext);
}

function collectBomViolations() {
    const violations = [];

    walkFiles(ROOT, (filePath) => {
        if (!isTextFile(filePath)) {
            return;
        }

        const buffer = fs.readFileSync(filePath);
        if (buffer.length < 3) {
            return;
        }

        if (buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf) {
            violations.push(rel(filePath));
        }
    });

    return violations.sort();
}

function collectCacheViolations() {
    const violations = [];
    const cacheRegex = /\bCache::(remember|put|get|forget|has|many|forever|tags)\s*\(/;

    for (const targetDir of CACHE_TARGET_DIRS) {
        const absoluteDir = path.join(ROOT, targetDir);
        if (!fs.existsSync(absoluteDir)) {
            continue;
        }

        walkFiles(absoluteDir, (filePath) => {
            if (path.extname(filePath).toLowerCase() !== '.php') {
                return;
            }

            const relative = rel(filePath);
            if (CACHE_ALLOWLIST.has(relative)) {
                return;
            }

            const lines = fs.readFileSync(filePath, 'utf8').split(/\r?\n/);
            lines.forEach((line, index) => {
                if (cacheRegex.test(line)) {
                    violations.push(`${relative}:${index + 1}`);
                }
            });
        });
    }

    return violations.sort();
}

function collectRouteGuardViolations() {
    const violations = [];

    const routeFile = path.join(ROOT, 'apps/api/routes/api.php');
    const bootstrapFile = path.join(ROOT, 'apps/api/bootstrap/app.php');
    const configControllerFile = path.join(ROOT, 'apps/api/app/Http/Controllers/Api/V1/ConfigController.php');

    if (fs.existsSync(routeFile)) {
        const routeContent = fs.readFileSync(routeFile, 'utf8');
        if (!routeContent.includes("Route::middleware('require-tenant')->group(function () {")) {
            violations.push('apps/api/routes/api.php:missing require-tenant middleware group');
        }
    } else {
        violations.push('apps/api/routes/api.php:not found');
    }

    if (fs.existsSync(bootstrapFile)) {
        const bootstrapContent = fs.readFileSync(bootstrapFile, 'utf8');
        if (!bootstrapContent.includes("'require-tenant' => \\App\\Http\\Middleware\\RequireTenant::class")) {
            violations.push('apps/api/bootstrap/app.php:missing require-tenant alias');
        }
    } else {
        violations.push('apps/api/bootstrap/app.php:not found');
    }

    if (fs.existsSync(configControllerFile)) {
        const configContent = fs.readFileSync(configControllerFile, 'utf8');
        if (!configContent.includes("->header('Vary', 'Host, X-City')")) {
            violations.push('apps/api/app/Http/Controllers/Api/V1/ConfigController.php:missing Vary header');
        }
    } else {
        violations.push('apps/api/app/Http/Controllers/Api/V1/ConfigController.php:not found');
    }

    return violations;
}

function loadBaseline() {
    if (!fs.existsSync(BASELINE_PATH)) {
        return {
            bomViolations: [],
            directCacheViolations: [],
        };
    }

    return JSON.parse(fs.readFileSync(BASELINE_PATH, 'utf8'));
}

function saveBaseline(current) {
    const baseline = {
        bomViolations: current.bomViolations,
        directCacheViolations: current.directCacheViolations,
    };

    fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(baseline, null, 2)}\n`, 'utf8');
}

function diff(current, baseline) {
    const baselineSet = new Set(baseline);
    return current.filter((item) => !baselineSet.has(item));
}

function main() {
    const updateBaseline = process.argv.includes('--update-baseline');

    const bomViolations = collectBomViolations();
    const directCacheViolations = collectCacheViolations();
    const routeGuardViolations = collectRouteGuardViolations();

    const baseline = loadBaseline();
    const newBomViolations = diff(
        bomViolations,
        baseline.bomViolations || []
    );
    const newDirectCacheViolations = diff(
        directCacheViolations,
        baseline.directCacheViolations || []
    );

    if (updateBaseline) {
        saveBaseline({ bomViolations, directCacheViolations });
        console.log('Updated tenancy guardrails baseline.');
        console.log(`BOM baseline entries: ${bomViolations.length}`);
        console.log(`Direct cache baseline entries: ${directCacheViolations.length}`);
        process.exit(0);
    }

    let failed = false;

    if (newBomViolations.length > 0) {
        failed = true;
        console.error('New BOM violations found:');
        newBomViolations.forEach((item) => console.error(`  - ${item}`));
    }

    if (routeGuardViolations.length > 0) {
        failed = true;
        console.error('Route guard violations found:');
        routeGuardViolations.forEach((item) => console.error(`  - ${item}`));
    }

    if (newDirectCacheViolations.length > 0) {
        failed = true;
        console.error('New direct Cache usage in tenant-aware areas:');
        newDirectCacheViolations.forEach((item) => console.error(`  - ${item}`));
        console.error('');
        console.error('Use TenantCache or add a justified allowlist/baseline update.');
    }

    if (failed) {
        process.exit(1);
    }

    console.log('Tenancy guardrails check passed.');
    console.log(`BOM violations (baseline): ${bomViolations.length}`);
    console.log(`Direct cache (baseline): ${directCacheViolations.length}`);
    console.log(`Route guard violations: ${routeGuardViolations.length}`);
}

main();
