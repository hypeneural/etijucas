<?php

declare(strict_types=1);

use App\Domains\Votes\Models\Legislatura;
use App\Domains\Votes\Models\Mandato;
use App\Domains\Votes\Models\Partido;
use App\Domains\Votes\Models\Vereador;
use App\Domains\Votes\Models\Votacao;
use App\Models\Comment;
use App\Models\User;
use Illuminate\Contracts\Console\Kernel;

require __DIR__ . '/../vendor/autoload.php';

$app = require __DIR__ . '/../bootstrap/app.php';
$kernel = $app->make(Kernel::class);
$kernel->bootstrap();

$partido = Partido::updateOrCreate(
    ['sigla' => 'ADM'],
    ['nome' => 'Partido Admin', 'cor_hex' => '#111827', 'logo_url' => null]
);

$legislatura = Legislatura::updateOrCreate(
    ['numero' => 99],
    ['ano_inicio' => 2099, 'ano_fim' => 2102, 'atual' => false]
);

$vereador = Vereador::updateOrCreate(
    ['nome' => 'Vereador Admin Teste'],
    [
        'slug' => 'vereador-admin-teste',
        'nascimento' => '1980-01-01',
        'telefone' => '48999999900',
        'email' => 'vereador.admin@local.test',
        'bio' => 'Registro criado para validar fluxo administrativo.',
        'site_oficial_url' => null,
        'redes_sociais' => [],
        'ativo' => true,
    ]
);

Mandato::updateOrCreate(
    ['vereador_id' => $vereador->id, 'legislatura_id' => $legislatura->id],
    [
        'partido_id' => $partido->id,
        'cargo' => 'Vereador',
        'inicio' => '2099-01-01',
        'fim' => '2102-12-31',
        'em_exercicio' => false,
    ]
);

$mediaPath = storage_path('app/public/3/conversions/dummy-thumb.jpg');
if (file_exists($mediaPath) && $vereador->getMedia('vereador_avatar')->isEmpty()) {
    $vereador->addMedia($mediaPath)->toMediaCollection('vereador_avatar');
    $mediaUrl = $vereador->getFirstMediaUrl('vereador_avatar');
    if ($mediaUrl) {
        $vereador->forceFill(['foto_url' => $mediaUrl])->saveQuietly();
    }
}

$votacao = Votacao::first();
if (! $votacao) {
    $votacao = Votacao::create([
        'protocolo' => 'TESTE-ADMIN-001',
        'titulo' => 'Votacao de teste admin',
        'tipo' => 'PROJETO_LEI',
        'status' => 'EM_ANDAMENTO',
        'data' => now()->toDateString(),
        'sessao' => 'Sessao teste',
    ]);
}

$user = User::first();
if (! $user) {
    $user = User::create([
        'phone' => (string) random_int(48000000000, 48999999999),
        'nome' => 'User Teste',
        'email' => 'user.teste@local.test',
    ]);
}

$comment = Comment::create([
    'topic_id' => null,
    'user_id' => $user->id,
    'parent_id' => null,
    'commentable_type' => Votacao::class,
    'commentable_id' => $votacao->id,
    'texto' => 'Comentario de teste admin.',
    'image_url' => null,
    'is_anon' => false,
    'depth' => 0,
    'likes_count' => 0,
]);

$votacao->increment('comments_count');

$comment->delete();
$votacao->decrement('comments_count');

$comment->restore();
$votacao->increment('comments_count');

fwrite(STDOUT, sprintf(
    "OK: partido=%s legislatura=%s vereador=%s votacao=%s comment=%s\n",
    $partido->id,
    $legislatura->id,
    $vereador->id,
    $votacao->id,
    $comment->id,
));
