<?php

namespace App\Http\Controllers\Api;

use App\Exceptions\CepNotFoundException;
use App\Http\Controllers\Controller;
use App\Services\AddressMatcherService;
use App\Services\CepLookupService;
use App\Support\Normalizer;
use App\Support\Tenant;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * CepController
 * 
 * Handles CEP lookup and address matching.
 */
class CepController extends Controller
{
    public function __construct(
        private CepLookupService $cepLookup,
        private AddressMatcherService $addressMatcher,
    ) {
    }

    /**
     * Lookup address by CEP.
     * 
     * @param string $cep CEP to lookup (8 digits)
     * @return JsonResponse
     */
    public function lookup(string $cep, Request $request): JsonResponse
    {
        // Normalize CEP
        $cep = Normalizer::normalizeCep($cep);

        // Validate format
        if (strlen($cep) !== 8) {
            return response()->json([
                'success' => false,
                'error' => 'CEP inválido',
                'message' => 'O CEP deve conter exatamente 8 dígitos.',
            ], 422);
        }

        try {
            // Get tenant city
            $tenantCityId = Tenant::cityId();

            if (!$tenantCityId) {
                return response()->json([
                    'success' => false,
                    'error' => 'Contexto não encontrado',
                    'message' => 'Cidade não configurada.',
                ], 500);
            }

            // Lookup CEP
            $address = $this->cepLookup->lookup($cep);

            // Match address to bairro
            $match = $this->addressMatcher->match($tenantCityId, $address);

            // Get available bairros if no match
            $availableBairros = [];
            if (!$match->bairroOk) {
                $availableBairros = $this->addressMatcher
                    ->getAvailableBairros($tenantCityId)
                    ->toArray();
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'address' => $address->toArray(),
                    'match' => $match->toArray(),
                    'ui_hints' => $match->getUiHints(),
                    'available_bairros' => $availableBairros,
                ],
            ]);
        } catch (CepNotFoundException $e) {
            return response()->json([
                'success' => false,
                'error' => 'CEP não encontrado',
                'message' => $e->getMessage(),
            ], 404);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'error' => 'Erro interno',
                'message' => 'Não foi possível processar a solicitação.',
            ], 500);
        }
    }
}
