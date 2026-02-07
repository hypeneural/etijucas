<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__ . '/../routes/web.php',
        api: __DIR__ . '/../routes/api.php',
        commands: __DIR__ . '/../routes/console.php',
        health: '/up',
        apiPrefix: 'api',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        $middleware->alias([
            'role' => \Spatie\Permission\Middleware\RoleMiddleware::class,
            'permission' => \Spatie\Permission\Middleware\PermissionMiddleware::class,
            'role_or_permission' => \Spatie\Permission\Middleware\RoleOrPermissionMiddleware::class,
            'cache.headers' => \App\Http\Middleware\CacheHeaders::class,
            'idempotent' => \App\Http\Middleware\IdempotencyKey::class,
            'tenant' => \App\Http\Middleware\TenantContext::class,
            'require-tenant' => \App\Http\Middleware\RequireTenant::class,
            'module' => \App\Http\Middleware\ModuleEnabled::class,
        ]);

        // Exclude public API auth routes from CSRF verification
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Global middleware para API
        $middleware->api(append: [
            \App\Http\Middleware\RequestIdMiddleware::class,
            \App\Http\Middleware\Utf8Response::class,
            \App\Http\Middleware\TenantContext::class,
        ]);

        // Rate limiting for auth endpoints
        $middleware->throttleWithRedis();

        $middleware->statefulApi();
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
