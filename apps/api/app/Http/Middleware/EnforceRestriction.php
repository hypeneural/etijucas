<?php

namespace App\Http\Middleware;

use App\Domain\Moderation\Services\RestrictionEnforcementService;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnforceRestriction
{
    public function __construct(
        private readonly RestrictionEnforcementService $restrictionService
    ) {
    }

    public function handle(Request $request, Closure $next, string $moduleKey, string $typesCsv): Response
    {
        $user = $request->user();
        if (!$user) {
            return $next($request);
        }

        $types = array_values(array_filter(array_map('trim', explode('|', $typesCsv))));
        $restriction = $this->restrictionService->firstBlockingRestriction($user, $moduleKey, $types);

        if (!$restriction) {
            return $next($request);
        }

        $message = $this->messageForType((string) $restriction->type?->value);

        return response()->json([
            'error' => 'restriction_active',
            'code' => 'RESTRICTION_ACTIVE',
            'message' => $message,
            'details' => [
                'type' => $restriction->type?->value,
                'scope' => $restriction->scope?->value,
                'scope_module_key' => $restriction->scope_module_key,
                'scope_city_id' => $restriction->scope_city_id,
                'ends_at' => $restriction->ends_at?->toIso8601String(),
            ],
        ], 403);
    }

    private function messageForType(string $type): string
    {
        return match ($type) {
            'mute_forum' => 'Sua conta esta temporariamente impedida de interagir no forum.',
            'shadowban_forum' => 'Sua conta esta temporariamente impedida de publicar no forum.',
            'rate_limit_forum' => 'Sua conta atingiu um limite temporario de interacoes no forum.',
            'block_uploads' => 'Sua conta esta temporariamente impedida de enviar arquivos.',
            default => 'Acao indisponivel devido a uma restricao ativa.',
        };
    }
}
