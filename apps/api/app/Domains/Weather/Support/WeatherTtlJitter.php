<?php

declare(strict_types=1);

namespace App\Domains\Weather\Support;

class WeatherTtlJitter
{
    public function __construct(
        private readonly float $percent = 0.10,
    ) {
    }

    public function apply(int $ttlSeconds): int
    {
        if ($ttlSeconds <= 1) {
            return 1;
        }

        $ratio = max(0.0, min($this->percent, 0.5));
        $min = max(1, (int) floor($ttlSeconds * (1 - $ratio)));
        $max = max($min, (int) ceil($ttlSeconds * (1 + $ratio)));

        return random_int($min, $max);
    }
}
