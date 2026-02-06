<?php

namespace App\Http\Controllers\Api;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use App\Http\Controllers\Controller;

class PlateOcrController extends Controller
{
    /**
     * Recognize license plates from an uploaded image.
     * Uses Plate Recognizer Snapshot API.
     *
     * POST /api/v1/plates/recognize
     */
    public function recognize(Request $request)
    {
        $request->validate([
            'image' => ['required', 'file', 'mimes:jpg,jpeg,png,webp', 'max:5120'], // max 5MB
        ]);

        $token = config('services.plate_recognizer.token');
        if (!$token) {
            return response()->json([
                'ok' => false,
                'message' => 'OCR não configurado',
            ], 500);
        }

        $file = $request->file('image');
        $regions = config('services.plate_recognizer.regions', 'br');

        try {
            // Use file_get_contents for binary content
            $fileContent = file_get_contents($file->getRealPath());
            $fileName = $file->getClientOriginalName() ?: 'image.jpg';

            // Build multipart form data
            $response = Http::timeout(20)
                ->withHeaders([
                    'Authorization' => "Token {$token}",
                ])
                ->attach('upload', $fileContent, $fileName)
                ->post('https://api.platerecognizer.com/v1/plate-reader/', [
                    'regions' => $regions,
                ]);

            // Log response for debugging
            \Log::info('Plate Recognizer Response', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);

            if (!$response->successful()) {
                return response()->json([
                    'ok' => false,
                    'message' => 'Falha no reconhecimento',
                    'status' => $response->status(),
                    'debug' => $response->body(),
                ], 502);
            }

            $json = $response->json();

            // Normalize results for frontend
            $results = collect($json['results'] ?? [])
                ->map(function ($result) {
                    $plate = strtoupper(preg_replace('/[^A-Z0-9]/', '', $result['plate'] ?? ''));
                    $score = round($result['score'] ?? 0, 3);
                    $dscore = round($result['dscore'] ?? 0, 3);

                    // Get candidates
                    $candidates = collect($result['candidates'] ?? [])
                        ->map(function ($c) {
                        return [
                            'plate' => strtoupper(preg_replace('/[^A-Z0-9]/', '', $c['plate'] ?? '')),
                            'score' => round($c['score'] ?? 0, 3),
                        ];
                    })
                        ->filter(fn($c) => strlen($c['plate']) === 7)
                        ->values()
                        ->toArray();

                    return [
                        'plate' => $plate,
                        'score' => $score,
                        'dscore' => $dscore,
                        'box' => $result['box'] ?? null,
                        'candidates' => $candidates,
                        'region' => $result['region']['code'] ?? null,
                        'vehicle_type' => $result['vehicle']['type'] ?? null,
                    ];
                })
                // Filter only valid BR plates (7 chars)
                ->filter(fn($r) => strlen($r['plate']) === 7)
                ->values()
                ->toArray();

            return response()->json([
                'ok' => true,
                'processing_time_ms' => $json['processing_time'] ?? null,
                'results' => $results,
            ]);

        } catch (\Exception $e) {
            report($e);
            return response()->json([
                'ok' => false,
                'message' => 'Erro ao processar imagem',
            ], 500);
        }
    }
}
