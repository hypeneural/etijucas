<?php

use App\Support\Tenant;

require __DIR__ . '/vendor/autoload.php';

$app = require_once __DIR__ . '/bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

// Simulate binding the tenant like middleware does
$citySlug = 'tijucas-sc';
$city = App\Models\City::where('slug', $citySlug)->first();

if (!$city) {
    die("City not found");
}

app()->instance('tenant.city', $city);

$config = Tenant::config();

echo json_encode($config, JSON_PRETTY_PRINT);
