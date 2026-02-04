<?php

declare(strict_types=1);

use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$app->make(Kernel::class)->bootstrap();

$email = getenv('ADMIN_EMAIL') ?: 'admin@etijucas.com.br';
$phone = getenv('ADMIN_PHONE') ?: '48999990000';
$password = getenv('ADMIN_PASSWORD') ?: 'Etijucas@Admin#2026';

$user = User::withTrashed()
    ->where('email', $email)
    ->orWhere('phone', $phone)
    ->first();

if (! $user) {
    $user = User::create([
        'nome' => 'Administrador',
        'email' => $email,
        'phone' => $phone,
        'password' => $password,
        'phone_verified' => true,
        'phone_verified_at' => now(),
    ]);
} else {
    if ($user->trashed()) {
        $user->restore();
    }

    $user->fill([
        'nome' => 'Administrador',
        'email' => $email,
        'phone' => $phone,
        'password' => $password,
        'phone_verified' => true,
        'phone_verified_at' => now(),
    ]);

    $user->save();
}

$user->syncRoles(['admin']);

echo $user->id . PHP_EOL;
