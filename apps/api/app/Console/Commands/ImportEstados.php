<?php

namespace App\Console\Commands;

use App\Models\State;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ImportEstados extends Command
{
    protected $signature = 'import:estados {path? : Path to municipios-brasileiros-main folder}';
    protected $description = 'Import Brazilian states from JSON file';

    public function handle(): int
    {
        $path = $this->argument('path')
            ?? 'C:\Users\Usuario\Desktop\municipios-brasileiros-main';

        $file = $path . '/json/estados.json';

        if (!file_exists($file)) {
            $this->error("File not found: {$file}");
            return self::FAILURE;
        }

        $this->info('Importing states...');

        $content = file_get_contents($file);

        // Remove UTF-8 BOM if present
        $content = preg_replace('/^\xEF\xBB\xBF/', '', $content);

        $estados = json_decode($content, true);

        if (!$estados) {
            $this->error('Failed to parse JSON: ' . json_last_error_msg());
            return self::FAILURE;
        }

        $batch = [];
        $now = now();

        foreach ($estados as $e) {
            $batch[] = [
                'id' => Str::uuid()->toString(),
                'ibge_code' => $e['codigo_uf'],
                'uf' => $e['uf'],
                'name' => $e['nome'],
                'lat' => $e['latitude'],
                'lon' => $e['longitude'],
                'region' => $e['regiao'],
                'created_at' => $now,
                'updated_at' => $now,
            ];
        }

        // Upsert all states
        DB::table('states')->upsert(
            $batch,
            ['ibge_code'], // conflict key
            ['uf', 'name', 'lat', 'lon', 'region', 'updated_at']
        );

        $count = State::count();
        $this->info("✅ {$count} states imported successfully!");

        return self::SUCCESS;
    }
}
