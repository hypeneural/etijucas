<?php

namespace Database\Seeders;

use App\Models\City;
use App\Models\State;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\DB;

class FullBrazilianCitiesSeeder extends Seeder
{
    /**
     * Import all Brazilian states and cities from JSON files.
     * 
     * Uses data from: C:\Users\Usuario\Desktop\municipios-brasileiros-main\json
     */
    public function run(): void
    {
        $basePath = 'C:\\Users\\Usuario\\Desktop\\municipios-brasileiros-main\\json';

        $this->seedStates($basePath . '\\estados.json');
        $this->seedCities($basePath . '\\municipios.json');
    }

    /**
     * Seed states from estados.json
     */
    private function seedStates(string $filePath): void
    {
        $this->command->info('Importing states from ' . $filePath);

        $json = file_get_contents($filePath);
        // Remove BOM if present
        $json = preg_replace('/^\xEF\xBB\xBF/', '', $json);
        $states = json_decode($json, true);

        if (!$states) {
            $this->command->error('Could not parse estados.json');
            return;
        }

        $imported = 0;
        foreach ($states as $stateData) {
            State::updateOrCreate(
                ['ibge_code' => $stateData['codigo_uf']],
                [
                    'name' => $stateData['nome'],
                    'uf' => $stateData['uf'],
                    'lat' => $stateData['latitude'] ?? null,
                    'lon' => $stateData['longitude'] ?? null,
                    'region' => $stateData['regiao'] ?? null,
                ]
            );
            $imported++;
        }

        $this->command->info("✅ Imported {$imported} states");
    }

    /**
     * Seed cities from municipios.json
     */
    private function seedCities(string $filePath): void
    {
        $this->command->info('Importing cities from ' . $filePath . ' (this may take a while...)');

        $json = file_get_contents($filePath);
        // Remove BOM if present
        $json = preg_replace('/^\xEF\xBB\xBF/', '', $json);
        $cities = json_decode($json, true);

        if (!$cities) {
            $this->command->error('Could not parse municipios.json: ' . json_last_error_msg());
            return;
        }

        // Build state lookup
        $stateMap = State::pluck('id', 'ibge_code')->toArray();

        $this->command->info('Found ' . count($cities) . ' cities to import');

        // Use chunked insert for performance
        $chunks = array_chunk($cities, 500);
        $imported = 0;

        foreach ($chunks as $chunk) {
            $records = [];

            foreach ($chunk as $cityData) {
                $stateId = $stateMap[$cityData['codigo_uf']] ?? null;
                $cityName = $cityData['nome'];
                $uf = $this->getUfFromCodigoUf($cityData['codigo_uf']);

                $records[] = [
                    'id' => Str::uuid()->toString(),
                    'state_id' => $stateId,
                    'ibge_code' => $cityData['codigo_ibge'],
                    'name' => $cityName,
                    'uf' => $uf,
                    'slug' => Str::slug($cityName . '-' . $uf),
                    'status' => 'draft',
                    'lat' => $cityData['latitude'] ?? null,
                    'lon' => $cityData['longitude'] ?? null,
                    'ddd' => isset($cityData['ddd']) ? (string) $cityData['ddd'] : null,
                    'timezone' => $cityData['fuso_horario'] ?? 'America/Sao_Paulo',
                    'is_coastal' => false,
                    'active' => ($cityData['codigo_ibge'] == 4218004), // Only Tijucas is active (ibge: 4218004)
                    'is_capital' => (bool) ($cityData['capital'] ?? false),
                    'siafi_id' => $cityData['siafi_id'] ?? null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ];
            }

            // Use upsert to handle existing records
            City::upsert(
                $records,
                ['ibge_code'], // unique key
                ['name', 'uf', 'slug', 'lat', 'lon', 'ddd', 'timezone', 'is_capital', 'siafi_id', 'state_id', 'updated_at']
            );

            $imported += count($records);
            $this->command->info("Imported {$imported} cities...");
        }

        // Set Tijucas as active with 'active' status
        City::where('ibge_code', 4218004)->update([
            'active' => true,
            'status' => 'active',
        ]);

        $this->command->info("✅ Total: {$imported} cities imported. Tijucas is active.");
    }

    /**
     * Get UF from codigo_uf
     */
    private function getUfFromCodigoUf(int $codigoUf): string
    {
        $map = [
            11 => 'RO',
            12 => 'AC',
            13 => 'AM',
            14 => 'RR',
            15 => 'PA',
            16 => 'AP',
            17 => 'TO',
            21 => 'MA',
            22 => 'PI',
            23 => 'CE',
            24 => 'RN',
            25 => 'PB',
            26 => 'PE',
            27 => 'AL',
            28 => 'SE',
            29 => 'BA',
            31 => 'MG',
            32 => 'ES',
            33 => 'RJ',
            35 => 'SP',
            41 => 'PR',
            42 => 'SC',
            43 => 'RS',
            50 => 'MS',
            51 => 'MT',
            52 => 'GO',
            53 => 'DF',
        ];

        return $map[$codigoUf] ?? 'XX';
    }
}
