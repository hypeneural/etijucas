#!/usr/bin/env node

/**
 * make-feature.js
 * 
 * Scaffold para criar nova feature com estrutura padrão.
 * Cria pasta no front e no back + adiciona ao features.yaml.
 * 
 * Usage: pnpm make:feature <nome>
 * Example: pnpm make:feature notifications
 */

const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const FEATURES_YAML = path.join(__dirname, '../contracts/features.yaml');
const FRONTEND_FEATURES = path.join(__dirname, '../apps/web/src/features');
const BACKEND_DOMAINS = path.join(__dirname, '../apps/api/app/Domains');

function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function kebabToPascal(str) {
    return str.split('-').map(capitalize).join('');
}

function createDir(dirPath) {
    if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        console.log(`  ✅ Created: ${path.relative(process.cwd(), dirPath)}`);
    }
}

function writeFile(filePath, content) {
    fs.writeFileSync(filePath, content);
    console.log(`  ✅ Created: ${path.relative(process.cwd(), filePath)}`);
}

function createFrontendFeature(name) {
    const featurePath = path.join(FRONTEND_FEATURES, name);
    const pascalName = kebabToPascal(name);

    createDir(featurePath);
    createDir(path.join(featurePath, 'api'));
    createDir(path.join(featurePath, 'components'));
    createDir(path.join(featurePath, 'pages'));
    createDir(path.join(featurePath, 'types'));

    // index.ts
    writeFile(path.join(featurePath, 'index.ts'), `/**
 * ${pascalName} Feature
 * 
 * @see contracts/features.yaml
 * @see FEATURES.md
 */

export * from './api';
// export * from './components';
// export * from './pages';
`);

    // api/index.ts
    writeFile(path.join(featurePath, 'api', 'index.ts'), `/**
 * ${pascalName} API Hooks
 * 
 * Query keys e hooks do TanStack Query.
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

export const ${name}Keys = {
  all: ['${name}'] as const,
  list: (filters?: unknown) => [...${name}Keys.all, 'list', filters] as const,
  detail: (id: string) => [...${name}Keys.all, 'detail', id] as const,
};

export function use${pascalName}ListQuery(filters?: unknown) {
  return useQuery({
    queryKey: ${name}Keys.list(filters),
    queryFn: async () => {
      // TODO: Integrate with @repo/sdk
      throw new Error('TODO: Implement');
    },
  });
}

export function use${pascalName}DetailQuery(id: string) {
  return useQuery({
    queryKey: ${name}Keys.detail(id),
    queryFn: async () => {
      // TODO: Integrate with @repo/sdk
      throw new Error('TODO: Implement');
    },
    enabled: !!id,
  });
}
`);
}

function createBackendDomain(name) {
    const domainPath = path.join(BACKEND_DOMAINS, capitalize(name));
    const pascalName = kebabToPascal(name);

    createDir(domainPath);
    createDir(path.join(domainPath, 'Http', 'Controllers'));
    createDir(path.join(domainPath, 'Http', 'Requests'));
    createDir(path.join(domainPath, 'Http', 'Resources'));
    createDir(path.join(domainPath, 'Actions'));
    createDir(path.join(domainPath, 'Policies'));
    createDir(path.join(domainPath, 'Models'));
    createDir(path.join(domainPath, 'Services'));

    // README.php
    writeFile(path.join(domainPath, 'README.php'), `<?php

/**
 * ${pascalName} Domain
 * 
 * @see contracts/features.yaml
 * @see FEATURES.md
 */
`);

    // routes.php (optional)
    writeFile(path.join(domainPath, 'routes.php'), `<?php

use Illuminate\\Support\\Facades\\Route;

/**
 * ${pascalName} Routes
 * 
 * Include this file in routes/api.php:
 * require app_path('Domains/${capitalize(name)}/routes.php');
 */

Route::prefix('${name}')->group(function () {
    // TODO: Add routes
});
`);
}

function addToFeaturesYaml(name) {
    const pascalName = kebabToPascal(name);

    let featuresData = { features: {} };
    if (fs.existsSync(FEATURES_YAML)) {
        featuresData = yaml.parse(fs.readFileSync(FEATURES_YAML, 'utf8'));
    }

    if (featuresData.features[name]) {
        console.log(`  ⚠️  Feature '${name}' already exists in features.yaml`);
        return;
    }

    featuresData.features[name] = {
        screens: [`${pascalName}Screen`],
        api: [`GET /api/v1/${name}`, `POST /api/v1/${name}`],
        tables: [name],
        permissions: {
            read: 'public',
            write: 'auth:sanctum',
            mod: null
        },
        offline: false
    };

    fs.writeFileSync(FEATURES_YAML, yaml.stringify(featuresData, { indent: 2 }));
    console.log(`  ✅ Added to: contracts/features.yaml`);
}

function main() {
    const name = process.argv[2];

    if (!name) {
        console.log('Usage: pnpm make:feature <name>');
        console.log('Example: pnpm make:feature notifications');
        process.exit(1);
    }

    // Normalize name (lowercase, kebab-case)
    const normalizedName = name.toLowerCase().replace(/[^a-z0-9-]/g, '-');

    console.log(`\n🚀 Creating feature: ${normalizedName}\n`);

    console.log('📂 Frontend (apps/web/src/features/)');
    createFrontendFeature(normalizedName);

    console.log('\n📂 Backend (apps/api/app/Domains/)');
    createBackendDomain(normalizedName);

    console.log('\n📝 Features Map');
    addToFeaturesYaml(normalizedName);

    console.log(`
✅ Feature '${normalizedName}' created!

Next steps:
1. Update contracts/features.yaml with correct endpoints
2. Add routes to apps/api/routes/api.php
3. Implement SDK endpoints in packages/sdk/src/client.ts
4. Run 'pnpm check:features' to validate

Docs: See CONTRIBUTING.md for conventions
`);
}

main();
