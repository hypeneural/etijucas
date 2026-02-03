<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\{{Feature}}\{{Model}}Controller;

/**
 * {{Feature}} Routes
 *
 * Include this file in routes/api.php:
 * require app_path('Domains/{{Feature}}/routes.php');
 */

Route::prefix('{{featurePrefix}}')->group(function () {
    Route::get('{{routeListPath}}', [{{Model}}Controller::class, 'index']);
    Route::get('{{routeItemPath}}', [{{Model}}Controller::class, 'show']);
    Route::post('{{routeListPath}}', [{{Model}}Controller::class, 'store']);
    Route::put('{{routeItemPath}}', [{{Model}}Controller::class, 'update']);
    Route::delete('{{routeItemPath}}', [{{Model}}Controller::class, 'destroy']);
});
