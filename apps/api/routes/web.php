<?php

use App\Http\Controllers\Web\TenantPublicPageController;
use App\Support\TenantSpaResponder;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| SPA Routing: All non-API routes serve the React app from public/app/
| The React app handles its own routing via react-router-dom
|
*/

/**
 * SPA responder used by both canonical tenant routes and legacy fallback routes.
 */
$serveSpa = static function () {
    return TenantSpaResponder::make();
};

// Canonical tenant-aware web route: /{uf}/{cidade}/...
Route::middleware(['tenant', 'require-tenant'])
    ->get('/{uf}/{cidade}/{any?}', TenantPublicPageController::class)
    ->where('uf', '[a-zA-Z]{2}')
    ->where('cidade', '[a-zA-Z0-9-]+')
    ->where('any', '.*');

// Legacy SPA fallback for non-tenant paths
Route::get('/{any?}', $serveSpa)
    ->where('any', '^(?!api|admin|filament|sanctum|livewire).*$');
