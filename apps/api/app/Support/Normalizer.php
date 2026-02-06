<?php

namespace App\Support;

use Illuminate\Support\Str;

/**
 * Normalizer
 * 
 * Helper class for normalizing text to canonical keys.
 * Used for matching bairro names from different sources.
 */
class Normalizer
{
    /**
     * Convert text to a canonical key for matching.
     * 
     * - Removes common suffixes like "(Tijucas)", "- SC"
     * - Replaces special characters with spaces
     * - Removes accents
     * - Converts to lowercase
     * - Squishes whitespace
     * - Returns slug format
     * 
     * @param string $text The text to normalize
     * @return string The canonical key
     */
    public static function toCanonicalKey(string $text): string
    {
        return Str::of($text)
            // Remove common suffixes
            ->replace(['(Tijucas)', '(tijucas)', '- Tijucas', '- tijucas'], '')
            ->replace(['/ SC', '/SC', '- SC', '-SC'], '')
            // Replace separators with spaces
            ->replace(['/', '-', '.', ',', '(', ')'], ' ')
            // Remove accents
            ->ascii()
            // Lowercase
            ->lower()
            // Remove extra whitespace
            ->squish()
            // Convert to slug
            ->slug()
            ->toString();
    }

    /**
     * Normalize a CEP to 8 digits.
     * 
     * @param string $cep The CEP to normalize
     * @return string The normalized CEP (8 digits)
     */
    public static function normalizeCep(string $cep): string
    {
        return preg_replace('/\D/', '', $cep);
    }

    /**
     * Format a CEP with hyphen.
     * 
     * @param string $cep The CEP to format
     * @return string The formatted CEP (XXXXX-XXX)
     */
    public static function formatCep(string $cep): string
    {
        $clean = self::normalizeCep($cep);

        if (strlen($clean) !== 8) {
            return $clean;
        }

        return substr($clean, 0, 5) . '-' . substr($clean, 5);
    }
}
