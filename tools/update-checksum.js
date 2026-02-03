#!/usr/bin/env node

/**
 * update-checksum.js
 * 
 * Updates the contracts checksum after SDK generation.
 */

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const OPENAPI_PATH = path.join(__dirname, '../contracts/openapi.yaml');
const CHECKSUM_PATH = path.join(__dirname, '../.contracts-checksum');

function getFileHash(filePath) {
    if (!fs.existsSync(filePath)) {
        return null;
    }
    const content = fs.readFileSync(filePath, 'utf8');
    return crypto.createHash('md5').update(content).digest('hex');
}

const hash = getFileHash(OPENAPI_PATH);
if (hash) {
    fs.writeFileSync(CHECKSUM_PATH, hash);
    console.log(`✅ Checksum updated: ${hash.substring(0, 8)}...`);
}
