<?php
/**
 * BOM Remover Script
 * 
 * Acesse este arquivo pelo browser para remover BOM de todos os arquivos PHP
 * URL: https://etijucas.com.br/fix-bom.php
 * 
 * IMPORTANTE: Delete este arquivo após usar!
 */

// Security: Simple token protection
$token = $_GET['token'] ?? '';
if ($token !== 'etijucas2026') {
    die('Acesso negado. Use: ?token=etijucas2026');
}

set_time_limit(300);
error_reporting(E_ALL);
ini_set('display_errors', 1);

$baseDir = __DIR__ . '/apps/api';
$fixed = 0;
$scanned = 0;
$errors = [];

echo "<!DOCTYPE html><html><head><meta charset='utf-8'><title>BOM Remover</title></head><body>";
echo "<h1>🔧 BOM Remover</h1>";
echo "<p>Escaneando: <code>$baseDir</code></p>";
echo "<hr>";

function removeBOM($filePath)
{
    $content = file_get_contents($filePath);
    if ($content === false) {
        return ['success' => false, 'message' => 'Não foi possível ler o arquivo'];
    }

    // Check for UTF-8 BOM (EF BB BF)
    $bom = pack('H*', 'EFBBBF');
    $hasBom = strncmp($content, $bom, 3) === 0;

    // Check for whitespace before <?php
    $startsWithPhp = strpos($content, '<?php') === 0;
    $hasLeadingWhitespace = !$startsWithPhp && preg_match('/^\s+<\?php/', $content);

    if (!$hasBom && !$hasLeadingWhitespace) {
        return ['success' => true, 'changed' => false];
    }

    // Remove BOM
    if ($hasBom) {
        $content = substr($content, 3);
    }

    // Remove leading whitespace before <?php
    if ($hasLeadingWhitespace) {
        $content = preg_replace('/^\s+(<\?php)/', '$1', $content);
    }

    // Write back
    $result = file_put_contents($filePath, $content);
    if ($result === false) {
        return ['success' => false, 'message' => 'Não foi possível escrever no arquivo'];
    }

    return ['success' => true, 'changed' => true, 'hadBom' => $hasBom, 'hadWhitespace' => $hasLeadingWhitespace];
}

function scanDirectory($dir, &$fixed, &$scanned, &$errors)
{
    $iterator = new RecursiveIteratorIterator(
        new RecursiveDirectoryIterator($dir, RecursiveDirectoryIterator::SKIP_DOTS),
        RecursiveIteratorIterator::SELF_FIRST
    );

    foreach ($iterator as $file) {
        if ($file->isFile() && $file->getExtension() === 'php') {
            // Skip vendor directory
            if (strpos($file->getPathname(), '/vendor/') !== false) {
                continue;
            }

            $scanned++;
            $result = removeBOM($file->getPathname());

            if (!$result['success']) {
                $errors[] = $file->getPathname() . ': ' . $result['message'];
            } elseif ($result['changed']) {
                $fixed++;
                $relativePath = str_replace($dir, '', $file->getPathname());
                $details = [];
                if ($result['hadBom'] ?? false)
                    $details[] = 'BOM';
                if ($result['hadWhitespace'] ?? false)
                    $details[] = 'whitespace';
                echo "<p>✅ Corrigido: <code>$relativePath</code> (" . implode(', ', $details) . ")</p>";
            }
        }
    }
}

// Run the scan
scanDirectory($baseDir, $fixed, $scanned, $errors);

echo "<hr>";
echo "<h2>📊 Resultado</h2>";
echo "<ul>";
echo "<li><strong>Arquivos escaneados:</strong> $scanned</li>";
echo "<li><strong>Arquivos corrigidos:</strong> $fixed</li>";
echo "<li><strong>Erros:</strong> " . count($errors) . "</li>";
echo "</ul>";

if (!empty($errors)) {
    echo "<h3>❌ Erros:</h3><ul>";
    foreach ($errors as $error) {
        echo "<li><code>$error</code></li>";
    }
    echo "</ul>";
}

if ($fixed > 0) {
    echo "<h2>🚀 Próximos passos:</h2>";
    echo "<ol>";
    echo "<li>Execute: <code>php artisan optimize:clear</code></li>";
    echo "<li><strong>DELETE este arquivo fix-bom.php!</strong></li>";
    echo "</ol>";
}

echo "<hr>";
echo "<p style='color: red;'><strong>⚠️ IMPORTANTE: Delete este arquivo após usar!</strong></p>";
echo "</body></html>";
