<?php

use App\Models\City;
use App\Models\Module;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

$citySlug = 'tijucas-sc';
$city = City::where('slug', $citySlug)->first();

if (!$city) {
    echo "City '{$citySlug}' NOT FOUND!\n";
    exit(1);
}

echo "City: {$city->name} ({$city->slug})\n";
echo "ID: {$city->id}\n";
echo "----------------------------------------\n";

$enabledModules = $city->modules()->wherePivot('enabled', true)->get();

if ($enabledModules->isEmpty()) {
    echo "No ENABLED modules found for {$city->name}.\n";
} else {
    echo "Enabled Modules:\n";
    foreach ($enabledModules as $module) {
        echo "- [x] {$module->slug} ({$module->name})\n";
    }
}

echo "----------------------------------------\n";
echo "Total Modules in Systems: " . Module::count() . "\n";
echo "Total Assigned to City: " . $city->modules()->count() . "\n";
