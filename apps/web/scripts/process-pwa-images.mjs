/**
 * PWA Image Processing Script
 * 
 * Este script processa as imagens fornecidas e cria todos os ícones PWA necessários.
 * 
 * Dependências:
 *   npm install sharp
 * 
 * Uso:
 *   node scripts/process-pwa-images.mjs
 */

import sharp from 'sharp';
import { copyFileSync, mkdirSync, existsSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Configuração de caminhos
const SOURCE_DIR = 'C:/Users/Usuario/Desktop/imgs_observada';
const OUTPUT_DIR = join(__dirname, '../public');

// Arquivos fonte
const ICON_SOURCE = join(SOURCE_DIR, 'icone.png');
const OG_SOURCE = join(SOURCE_DIR, 'metatagogg.png');
const FAVICON_SOURCE = join(SOURCE_DIR, 'favicon.ico');

// Cor de fundo para maskable icons (extraída do logo Observada)
const MASKABLE_BG_COLOR = '#f5f7f8';

async function processIcons() {
    console.log('🎨 Processando ícones PWA...\n');

    // PWA Icons (any purpose)
    const iconSizes = [
        { size: 192, name: 'pwa-192.png' },
        { size: 512, name: 'pwa-512.png' },
        { size: 180, name: 'apple-touch-icon.png' },
        { size: 32, name: 'favicon-32.png' },
    ];

    for (const { size, name } of iconSizes) {
        console.log(`  📐 Gerando ${name} (${size}x${size})...`);
        await sharp(ICON_SOURCE)
            .resize(size, size, { fit: 'contain', background: { r: 245, g: 247, b: 248, alpha: 1 } })
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(join(OUTPUT_DIR, name));
    }

    // Maskable Icons (with padding for safe zone)
    const maskableSizes = [
        { size: 192, name: 'pwa-192-maskable.png' },
        { size: 512, name: 'pwa-512-maskable.png' },
    ];

    for (const { size, name } of maskableSizes) {
        console.log(`  🎭 Gerando ${name} (${size}x${size} maskable)...`);

        // Maskable icons need 10% padding (safe zone is 80% of icon)
        const innerSize = Math.floor(size * 0.8);

        await sharp(ICON_SOURCE)
            .resize(innerSize, innerSize, { fit: 'contain', background: { r: 245, g: 247, b: 248, alpha: 1 } })
            .extend({
                top: Math.floor((size - innerSize) / 2),
                bottom: Math.ceil((size - innerSize) / 2),
                left: Math.floor((size - innerSize) / 2),
                right: Math.ceil((size - innerSize) / 2),
                background: { r: 245, g: 247, b: 248, alpha: 1 }
            })
            .png({ quality: 80, compressionLevel: 9 })
            .toFile(join(OUTPUT_DIR, name));
    }

    console.log('\n✅ Ícones processados!');
}

async function processOgImage() {
    console.log('\n🖼️  Processando imagem OG...\n');

    const ogOutput = join(OUTPUT_DIR, 'og-image.jpg');

    // OG Image: 1200x630 (ratio 1.91:1)
    console.log('  📐 Gerando og-image.jpg (1200x630)...');

    // Pegar metadata da imagem original
    const metadata = await sharp(OG_SOURCE).metadata();
    console.log(`  📏 Imagem original: ${metadata.width}x${metadata.height}`);

    await sharp(OG_SOURCE)
        .resize(1200, 630, {
            fit: 'cover',
            position: 'center'
        })
        .jpeg({ quality: 80, mozjpeg: true })
        .toFile(ogOutput);

    console.log('\n✅ OG Image processada!');
}

async function copyFavicon() {
    console.log('\n📋 Copiando favicon.ico...');

    const faviconOutput = join(OUTPUT_DIR, 'favicon.ico');
    copyFileSync(FAVICON_SOURCE, faviconOutput);

    console.log('✅ Favicon copiado!');
}

async function main() {
    console.log('═══════════════════════════════════════════════════');
    console.log('       Observada PWA Image Processor');
    console.log('═══════════════════════════════════════════════════\n');

    console.log(`📂 Fonte: ${SOURCE_DIR}`);
    console.log(`📂 Destino: ${OUTPUT_DIR}\n`);

    try {
        await processIcons();
        await processOgImage();
        await copyFavicon();

        console.log('\n═══════════════════════════════════════════════════');
        console.log('  ✨ Todas as imagens foram processadas com sucesso!');
        console.log('═══════════════════════════════════════════════════\n');

        console.log('Arquivos gerados:');
        console.log('  • pwa-192.png');
        console.log('  • pwa-512.png');
        console.log('  • pwa-192-maskable.png');
        console.log('  • pwa-512-maskable.png');
        console.log('  • apple-touch-icon.png');
        console.log('  • favicon-32.png');
        console.log('  • og-image.jpg');
        console.log('  • favicon.ico');

    } catch (error) {
        console.error('\n❌ Erro ao processar imagens:', error.message);
        process.exit(1);
    }
}

main();
