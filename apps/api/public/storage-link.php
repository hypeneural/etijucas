<?php
/**
 * Storage Link Fix Script
 * 
 * Access via: https://etijucas.com.br/storage-link.php
 * 
 * This creates the storage symlink without SSH access.
 * Delete this file after running it successfully!
 */

// Security check - change this token or remove after use
$secretToken = 'etijucas2026fix';

if (!isset($_GET['token']) || $_GET['token'] !== $secretToken) {
    http_response_code(403);
    echo "Unauthorized. Use: ?token={$secretToken}";
    exit;
}

// Paths
$target = __DIR__ . '/../storage/app/public';
$link = __DIR__ . '/storage';

echo "<h2>Storage Link Fix</h2>\n";
echo "<pre>\n";

// Check current state
echo "🎯 Target: {$target}\n";
echo "🔗 Link: {$link}\n\n";

if (file_exists($link)) {
    if (is_link($link)) {
        echo "✅ Symlink already exists!\n";
        echo "   Points to: " . readlink($link) . "\n";
    } else {
        echo "⚠️ 'storage' exists but is NOT a symlink (it's a directory).\n";
        echo "   This might cause issues.\n\n";

        // Check if it's empty
        $files = scandir($link);
        $fileCount = count($files) - 2; // remove . and ..

        if ($fileCount === 0) {
            echo "📁 The directory is empty. Attempting to remove and create symlink...\n";

            if (rmdir($link)) {
                echo "✅ Empty directory removed.\n";
            } else {
                echo "❌ Could not remove directory. Try manually.\n";
                exit;
            }
        } else {
            echo "📁 The directory contains {$fileCount} items.\n";
            echo "   Cannot safely remove. Please check manually.\n";

            echo "\n📝 Files inside:\n";
            foreach (array_diff(scandir($link), ['.', '..']) as $file) {
                echo "   - {$file}\n";
            }
            exit;
        }
    }
}

// Check if target exists
if (!file_exists($target)) {
    echo "❌ Target directory does not exist: {$target}\n";
    echo "   Creating it...\n";

    if (mkdir($target, 0755, true)) {
        echo "✅ Directory created.\n";
    } else {
        echo "❌ Could not create directory.\n";
        exit;
    }
}

// Create symlink if doesn't exist
if (!file_exists($link)) {
    echo "\n🔨 Creating symlink...\n";

    // On Windows, use junction/mklink, on Linux use symlink
    if (strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
        // Windows - use junction
        $cmd = 'mklink /D "' . str_replace('/', '\\', $link) . '" "' . str_replace('/', '\\', realpath($target)) . '"';
        echo "   Command: {$cmd}\n";
        exec($cmd, $output, $returnCode);

        if ($returnCode === 0) {
            echo "✅ Junction created successfully!\n";
        } else {
            echo "❌ Failed to create junction. Output:\n";
            print_r($output);
        }
    } else {
        // Linux/Unix
        if (symlink($target, $link)) {
            echo "✅ Symlink created successfully!\n";
        } else {
            echo "❌ Failed to create symlink.\n";
            echo "   Error: " . error_get_last()['message'] . "\n";
        }
    }
}

// Verify
echo "\n📋 Final verification:\n";

if (file_exists($link) && is_link($link)) {
    echo "✅ Symlink exists and points to: " . readlink($link) . "\n";

    // Check if target is accessible
    $testPath = $link . '/13';
    if (file_exists($testPath)) {
        echo "✅ Directory 13 found at {$testPath}\n";

        $files = scandir($testPath);
        echo "📁 Files in directory 13:\n";
        foreach (array_diff($files, ['.', '..']) as $file) {
            echo "   - {$file}\n";
        }
    } else {
        echo "⚠️ Directory 13 not found at {$testPath}\n";
    }
} else {
    echo "⚠️ Symlink verification failed.\n";
}

echo "\n🎉 Done! Delete this file after use.\n";
echo "</pre>";
