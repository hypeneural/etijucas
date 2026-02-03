#!/usr/bin/env node

/**
 * check-contracts.js
 * 
 * Verifica se o SDK está sincronizado com o OpenAPI spec.
 * Roda em CI para garantir que contracts/openapi.yaml e packages/sdk estão alinhados.
 * 
 * Usage:
 *   node tools/check-contracts.js
 *   pnpm check:contracts
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OPENAPI_PATH = path.join(__dirname, '../contracts/openapi.yaml');
const SDK_TYPES_PATH = path.join(__dirname, '../packages/sdk/src/generated-types.ts');
const CHECKSUM_PATH = path.join(__dirname, '../.contracts-checksum');

function getFileHash(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

function main() {
    console.log('🔍 Checking contracts alignment...\n');

    // Check if OpenAPI exists
    if (!fs.existsSync(OPENAPI_PATH)) {
        console.log('⚠️  contracts/openapi.yaml not found');
        console.log('   Create your OpenAPI spec to enable contract checking.');
        process.exit(0);
    }

    // Check if SDK types exist
    if (!fs.existsSync(SDK_TYPES_PATH)) {
        console.log('❌ packages/sdk/src/generated-types.ts not found');
        console.log('   Run: pnpm sdk:gen');
        process.exit(1);
    }

    const openapiHash = getFileHash(OPENAPI_PATH);
    const storedChecksum = fs.existsSync(CHECKSUM_PATH)
        ? fs.readFileSync(CHECKSUM_PATH, 'utf8').trim()
        : null;

    // If no stored checksum, create one
    if (!storedChecksum) {
        fs.writeFileSync(CHECKSUM_PATH, openapiHash);
        console.log('✅ Contracts checksum initialized');
        console.log(`   OpenAPI hash: ${openapiHash.substring(0, 8)}...`);
        process.exit(0);
    }

    // Compare checksums
    if (openapiHash !== storedChecksum) {
        console.log('❌ Contract drift detected!');
        console.log('');
        console.log('   The OpenAPI spec has changed since the SDK was last generated.');
        console.log('   To fix this, run:');
        console.log('');
        console.log('   pnpm sdk:gen');
        console.log('');
        console.log('   This will regenerate the SDK types and update the checksum.');
        process.exit(1);
    }

    console.log('✅ Contracts are in sync');
    console.log(`   OpenAPI hash: ${openapiHash.substring(0, 8)}...`);
    process.exit(0);
}

main();
