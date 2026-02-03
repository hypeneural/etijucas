<?php

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

// Serve the SPA for all non-API routes
Route::get('/{any?}', function () {
    $indexPath = public_path('app/index.html');
    
    if (file_exists($indexPath)) {
        return file_get_contents($indexPath);
    }
    
    // Fallback to welcome view if SPA not built yet
    return view('welcome');
})->where('any', '^(?!api|admin|filament|sanctum|livewire).*$');
