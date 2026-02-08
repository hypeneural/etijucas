<?php

namespace App\Console\Commands;

use App\Models\City;
use App\Models\State;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportMunicipios extends Command
{
    protected $signature = 'import:municipios 
        {path? : Path to municipios-brasileiros-main folder}
        {--chunk=1000 : Batch size for upsert}
        {--activate-tijucas : Activate Tijucas after import}';

    protected $description = 'Import Brazilian municipalities from JSON file using upsert';

    private array $stateMap = [];
    private array $ufMap = [];

    public function handle(): int
    {
        $path = $this->argument('path')
            ?? 'C:\Users\Usuario\Desktop\municipios-brasileiros-main';

        $file = $path . '/json/municipios.json';

        if (!file_exists($file)) {
            $this->error("File not found: {$file}");
            return self::FAILURE;
        }

        // Load state mappings
        $this->loadStateMaps();

        if (empty($this->stateMap)) {
            $this->error('No states found. Run import:estados first.');
            return self::FAILURE;
        }

        $this->info('Importing municipalities...');

        $content = file_get_contents($file);

        // Remove UTF-8 BOM if present
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        $municipios = json_decode($content, true);

        if (!$municipios) {
            $this->error('Failed to parse JSON: ' . json_last_error_msg());
            return self::FAILURE;
        }

        $chunkSize = (int) $this->option('chunk');
        $chunks = array_chunk($municipios, $chunkSize);
        $total = count($municipios);
        $imported = 0;

        $bar = $this->output->createProgressBar(count($chunks));
        $bar->start();

        foreach ($chunks as $chunk) {
            $batch = [];
            $now = now();

            foreach ($chunk as $m) {
                $codigoUf = $m['codigo_uf'];
                $uf = $this->ufMap[$codigoUf] ?? null;
                $stateId = $this->stateMap[$codigoUf] ?? null;

                if (!$uf) {
                    continue; // Skip if UF not found
                }

                $slug = Str::slug($m['nome']) . '-' . Str::lower($uf);

                $batch[] = [
                    'id' => Str::uuid()->toString(),
                    'state_id' => $stateId,
                    'ibge_code' => $m['codigo_ibge'],
                    'name' => $m['nome'],
                    'uf' => $uf,
                    'slug' => $slug,
                    'lat' => $m['latitude'],
                    'lon' => $m['longitude'],
                    'ddd' => (string) $m['ddd'],
                    'timezone' => str_replace('\\/', '/', $m['fuso_horario']),
                    'is_coastal' => false,
                    'is_capital' => $m['capital'] === 1,
                    'siafi_id' => $m['siafi_id'],
                    'active' => false, // ALL inactive by default
                    'created_at' => $now,
                    'updated_at' => $now,
                ];

                $imported++;
            }

            // Upsert batch
            DB::table('cities')->upsert(
                $batch,
                ['ibge_code'], // conflict key
                [
                    'state_id',
                    'name',
                    'uf',
                    'slug',
                    'lat',
                    'lon',
                    'ddd',
                    'timezone',
                    'is_coastal',
                    'is_capital',
                    'siafi_id',
                    'updated_at'
                ]
            );

            $bar->advance();
        }

        $bar->finish();
        $this->newLine();

        // Activate Tijucas if flag is set
        if ($this->option('activate-tijucas')) {
            City::where('ibge_code', 4218004)->update(['active' => true]);
            $this->info('✅ Tijucas activated!');
        }

        $count = City::count();
        $this->info("✅ {$count} municipalities in database ({$imported} processed)!");

        return self::SUCCESS;
    }

    private function loadStateMaps(): void
    {
        $states = State::all(['id', 'ibge_code', 'uf']);

        foreach ($states as $state) {
            $this->stateMap[$state->ibge_code] = $state->id;
            $this->ufMap[$state->ibge_code] = $state->uf;
        }

        $this->info("Loaded {$states->count()} states into memory.");
    }
}
