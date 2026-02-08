<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

class WeatherTtlPolicy
{
    /**
     * @return array{soft:int,hard:int}
     */
    public function forSection(string $section): array
    {
        return match (strtolower(trim($section))) {
            'marine' => ['soft' => 45 * 60, 'hard' => 6 * 60 * 60],
            'daily' => ['soft' => 45 * 60, 'hard' => 6 * 60 * 60],
            'current', 'hourly', 'forecast' => ['soft' => 15 * 60, 'hard' => 4 * 60 * 60],
            default => ['soft' => 15 * 60, 'hard' => 4 * 60 * 60],
        };
    }

    /**
     * @param array<int, string> $sections
     * @return array{soft:int,hard:int}
     */
    public function forSections(array $sections): array
    {
        if ($sections === []) {
            return $this->forSection('forecast');
        }

        $softs = [];
        $hards = [];

        foreach ($sections as $section) {
            $ttl = $this->forSection($section);
            $softs[] = $ttl['soft'];
            $hards[] = $ttl['hard'];
        }

        return [
            'soft' => min($softs),
            'hard' => max($hards),
        ];
    }
}
