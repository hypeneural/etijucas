<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class WdApiClient
{
    /**
     * Consult vehicle data from wdapi2.com.br
     * 
     * @param string $plate Normalized plate (ABC1D23 or ABC1234)
     * @param string|null $token API token (uses config if not provided)
     * @return array{status: int, json: array|null, error: string|null}
     */
    public function consult(string $plate, ?string $token = null): array
    {
        $token = $token ?? config('vehicle.token');

        if (!$token) {
            Log::error('WdApiClient: No API token configured');
            return [
                'status' => 500,
                'json' => null,
                'error' => 'Token da API não configurado.',
            ];
        }

        $baseUrl = rtrim(config('vehicle.base_url'), '/');
        $url = "{$baseUrl}/consulta/{$plate}/{$token}";

        try {
            $response = Http::timeout(8)
                ->retry(2, 300) // 2 retries, 300ms delay
                ->get($url);

            $status = $response->status();
            $json = $response->json();

            // Log for monitoring
            Log::info('WdApiClient: Consulted plate', [
                'plate' => $plate,
                'status' => $status,
                'has_data' => !empty($json),
            ]);

            return [
                'status' => $status,
                'json' => is_array($json) ? $json : null,
                'error' => $status !== 200 ? ($json['message'] ?? 'Erro na consulta.') : null,
            ];

        } catch (\Illuminate\Http\Client\ConnectionException $e) {
            Log::error('WdApiClient: Connection error', [
                'plate' => $plate,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 503,
                'json' => null,
                'error' => 'Serviço temporariamente indisponível.',
            ];

        } catch (\Exception $e) {
            Log::error('WdApiClient: Unexpected error', [
                'plate' => $plate,
                'error' => $e->getMessage(),
            ]);

            return [
                'status' => 500,
                'json' => null,
                'error' => 'Erro inesperado na consulta.',
            ];
        }
    }

    /**
     * Check API quota/balance
     * 
     * @return array{status: int, remaining: int|null, error: string|null}
     */
    public function checkBalance(?string $token = null): array
    {
        $token = $token ?? config('vehicle.token');

        if (!$token) {
            return ['status' => 500, 'remaining' => null, 'error' => 'Token não configurado.'];
        }

        $baseUrl = rtrim(config('vehicle.base_url'), '/');
        $url = "{$baseUrl}/saldo/{$token}";

        try {
            $response = Http::timeout(5)->get($url);
            $json = $response->json();

            return [
                'status' => $response->status(),
                'remaining' => $json['qtdConsultas'] ?? null,
                'error' => $response->status() !== 200 ? ($json['message'] ?? 'Erro ao verificar saldo.') : null,
            ];
        } catch (\Exception $e) {
            return [
                'status' => 500,
                'remaining' => null,
                'error' => $e->getMessage(),
            ];
        }
    }
}
