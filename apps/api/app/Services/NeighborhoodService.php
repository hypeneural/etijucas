<?php

declare(strict_types=1);

namespace App\Services;

use App\Models\Bairro;

class NeighborhoodService
{
    /**
     * Ensure a neighborhood exists, creating it if necessary.
     * 
     * @param string $bairroNome The neighborhood name
     * @return Bairro The existing or newly created neighborhood
     */
    public function ensureExists(string $bairroNome): Bairro
    {
        $normalizedName = $this->normalizeName($bairroNome);

        // Try to find by normalized name (case-insensitive)
        $bairro = Bairro::whereRaw('LOWER(nome) = ?', [strtolower($normalizedName)])->first();

        if ($bairro) {
            return $bairro;
        }

        // Create new neighborhood
        return Bairro::create([
            'nome' => $normalizedName,
            'slug' => \Illuminate\Support\Str::slug($normalizedName),
            'cidade' => 'Tijucas',
            'uf' => 'SC',
            'ativo' => true,
        ]);
    }

    /**
     * Find or create a neighborhood by ID or name.
     * 
     * @param string|null $id UUID of existing neighborhood
     * @param string|null $nome Name for new neighborhood
     * @return Bairro|null
     */
    public function findOrCreate(?string $id, ?string $nome): ?Bairro
    {
        // If ID provided, try to find it
        if ($id) {
            $bairro = Bairro::find($id);
            if ($bairro) {
                return $bairro;
            }
        }

        // If name provided, ensure it exists
        if ($nome) {
            return $this->ensureExists($nome);
        }

        return null;
    }

    /**
     * Normalize neighborhood name.
     */
    private function normalizeName(string $name): string
    {
        // Trim and convert to title case
        $name = trim($name);

        // Handle common abbreviations
        $name = preg_replace('/\bJd\.?\b/i', 'Jardim', $name);
        $name = preg_replace('/\bVl\.?\b/i', 'Vila', $name);
        $name = preg_replace('/\bPq\.?\b/i', 'Parque', $name);
        $name = preg_replace('/\bRes\.?\b/i', 'Residencial', $name);

        // Convert to title case
        return mb_convert_case($name, MB_CASE_TITLE, 'UTF-8');
    }
}
