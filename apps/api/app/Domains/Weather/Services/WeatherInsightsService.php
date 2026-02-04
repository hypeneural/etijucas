<?php

declare(strict_types=1);

namespace App\Domains\Weather\Services;

use Carbon\Carbon;

/**
 * WeatherInsightsService - Gera insights automáticos para leigos
 * 
 * Transforma dados brutos de previsão em frases claras e úteis:
 * - "Vai chover hoje?" → Sim/Não + horário
 * - "Dá praia?" → Score + motivo
 * - "Mar tá como?" → Calmo/Moderado/Agitado
 */
class WeatherInsightsService
{
    // Thresholds para classificação
    private const RAIN_PROB_LIKELY = 50;
    private const RAIN_PROB_POSSIBLE = 30;
    private const WIND_STRONG = 30;
    private const WIND_VERY_STRONG = 45;
    private const GUST_STRONG = 40;
    private const GUST_VERY_STRONG = 60;
    private const UV_HIGH = 6;
    private const UV_VERY_HIGH = 8;
    private const UV_EXTREME = 11;
    private const WAVE_CALM = 0.5;
    private const WAVE_MODERATE = 1.0;
    private const WAVE_ROUGH = 1.5;
    private const TEMP_DROP_ALERT = 6;

    /**
     * Gera todos os insights a partir dos dados de previsão
     */
    public function generateInsights(array $weatherData, array $marineData): array
    {
        $insights = [];
        $now = Carbon::now('America/Sao_Paulo');

        // Weather insights
        if (isset($weatherData['data'])) {
            $weather = $weatherData['data'];

            $insights = array_merge($insights, $this->generateRainInsights($weather, $now));
            $insights = array_merge($insights, $this->generateWindInsights($weather, $now));
            $insights = array_merge($insights, $this->generateTemperatureInsights($weather, $now));
            $insights = array_merge($insights, $this->generateUVInsights($weather, $now));
        }

        // Marine insights
        if (isset($marineData['data'])) {
            $marine = $marineData['data'];
            $insights = array_merge($insights, $this->generateMarineInsights($marine, $now));
        }

        // Beach score (combines weather + marine)
        if (isset($weatherData['data']) && isset($marineData['data'])) {
            $beachInsight = $this->generateBeachScore($weatherData['data'], $marineData['data'], $now);
            if ($beachInsight) {
                $insights[] = $beachInsight;
            }
        }

        // Sort by priority (higher = more important)
        usort($insights, fn($a, $b) => ($b['priority'] ?? 0) - ($a['priority'] ?? 0));

        return $insights;
    }

    /**
     * Insight de chuva - "Vai chover hoje?"
     */
    private function generateRainInsights(array $weather, Carbon $now): array
    {
        $insights = [];
        $hourly = $weather['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $rainProbs = $hourly['precipitation_probability'] ?? [];

        if (empty($times) || empty($rainProbs)) {
            return $insights;
        }

        // Check next 12 hours for rain windows
        $rainWindows = [];
        $noRainWindows = [];
        $currentRainWindow = null;
        $currentNoRainWindow = null;

        for ($i = 0; $i < min(24, count($times)); $i++) {
            $time = Carbon::parse($times[$i]);
            if ($time->lt($now))
                continue;

            $prob = $rainProbs[$i] ?? 0;

            if ($prob >= self::RAIN_PROB_LIKELY) {
                // Likely rain
                if ($currentNoRainWindow) {
                    $noRainWindows[] = $currentNoRainWindow;
                    $currentNoRainWindow = null;
                }
                if (!$currentRainWindow) {
                    $currentRainWindow = ['start' => $time, 'end' => $time, 'max_prob' => $prob];
                } else {
                    $currentRainWindow['end'] = $time;
                    $currentRainWindow['max_prob'] = max($currentRainWindow['max_prob'], $prob);
                }
            } else {
                // No rain
                if ($currentRainWindow) {
                    $rainWindows[] = $currentRainWindow;
                    $currentRainWindow = null;
                }
                if (!$currentNoRainWindow && $prob < self::RAIN_PROB_POSSIBLE) {
                    $currentNoRainWindow = ['start' => $time, 'end' => $time];
                } elseif ($currentNoRainWindow && $prob < self::RAIN_PROB_POSSIBLE) {
                    $currentNoRainWindow['end'] = $time;
                }
            }
        }

        // Close open windows
        if ($currentRainWindow)
            $rainWindows[] = $currentRainWindow;
        if ($currentNoRainWindow)
            $noRainWindows[] = $currentNoRainWindow;

        // Generate insights
        if (!empty($rainWindows)) {
            $window = $rainWindows[0];
            $startHour = $window['start']->format('H:i');
            $endHour = $window['end']->format('H:i');

            $insights[] = [
                'type' => 'rain',
                'icon' => 'mdi:weather-pouring',
                'severity' => 'warning',
                'priority' => 80,
                'title' => 'Vai chover',
                'message' => "Chuva provável entre {$startHour} e {$endHour}",
                'detail' => "Probabilidade até {$window['max_prob']}%",
            ];
        } else {
            // Check if there's a good no-rain window
            $insights[] = [
                'type' => 'rain',
                'icon' => 'mdi:weather-sunny',
                'severity' => 'success',
                'priority' => 40,
                'title' => 'Sem chuva',
                'message' => 'Não deve chover nas próximas horas',
                'detail' => null,
            ];
        }

        // Find longest no-rain window for planning
        if (!empty($noRainWindows)) {
            $longest = collect($noRainWindows)->sortByDesc(fn($w) => $w['end']->diffInHours($w['start']))->first();
            if ($longest && $longest['end']->diffInHours($longest['start']) >= 3) {
                $insights[] = [
                    'type' => 'rain_window',
                    'icon' => 'mdi:clock-outline',
                    'severity' => 'info',
                    'priority' => 50,
                    'title' => 'Janela sem chuva',
                    'message' => "Sem chuva entre {$longest['start']->format('H:i')} e {$longest['end']->format('H:i')}",
                    'detail' => 'Bom horário para atividades ao ar livre',
                ];
            }
        }

        return $insights;
    }

    /**
     * Insight de vento - "Vai ventar forte?"
     */
    private function generateWindInsights(array $weather, Carbon $now): array
    {
        $insights = [];
        $hourly = $weather['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $winds = $hourly['wind_speed_10m'] ?? [];
        $gusts = $hourly['wind_gusts_10m'] ?? [];

        if (empty($times) || empty($winds)) {
            return $insights;
        }

        $maxWind = 0;
        $maxGust = 0;
        $maxWindTime = null;

        for ($i = 0; $i < min(24, count($times)); $i++) {
            $time = Carbon::parse($times[$i]);
            if ($time->lt($now))
                continue;

            $wind = $winds[$i] ?? 0;
            $gust = $gusts[$i] ?? 0;

            if ($wind > $maxWind) {
                $maxWind = $wind;
                $maxWindTime = $time;
            }
            $maxGust = max($maxGust, $gust);
        }

        if ($maxWind >= self::WIND_VERY_STRONG || $maxGust >= self::GUST_VERY_STRONG) {
            $insights[] = [
                'type' => 'wind',
                'icon' => 'mdi:weather-windy',
                'severity' => 'danger',
                'priority' => 90,
                'title' => 'Vento muito forte',
                'message' => "Rajadas de até " . round($maxGust) . " km/h",
                'detail' => "Cuidado com guarda-sóis e objetos leves",
            ];
        } elseif ($maxWind >= self::WIND_STRONG || $maxGust >= self::GUST_STRONG) {
            $insights[] = [
                'type' => 'wind',
                'icon' => 'mdi:weather-windy',
                'severity' => 'warning',
                'priority' => 60,
                'title' => 'Vento moderado',
                'message' => "Vento de " . round($maxWind) . " km/h" . ($maxWindTime ? " às " . $maxWindTime->format('H:i') : ''),
                'detail' => $maxGust > $maxWind ? "Rajadas de até " . round($maxGust) . " km/h" : null,
            ];
        }

        return $insights;
    }

    /**
     * Insight de temperatura - "Vai esfriar/esquentar?"
     */
    private function generateTemperatureInsights(array $weather, Carbon $now): array
    {
        $insights = [];
        $hourly = $weather['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $temps = $hourly['temperature_2m'] ?? [];

        if (count($times) < 12 || count($temps) < 12) {
            return $insights;
        }

        // Find current and max temperature drop in next 12h
        $currentIdx = 0;
        foreach ($times as $i => $time) {
            if (Carbon::parse($time)->gte($now)) {
                $currentIdx = $i;
                break;
            }
        }

        $currentTemp = $temps[$currentIdx] ?? null;
        $minFutureTemp = $currentTemp;
        $minTempTime = null;

        for ($i = $currentIdx; $i < min($currentIdx + 12, count($temps)); $i++) {
            if (isset($temps[$i]) && $temps[$i] < $minFutureTemp) {
                $minFutureTemp = $temps[$i];
                $minTempTime = Carbon::parse($times[$i]);
            }
        }

        if ($currentTemp && $minFutureTemp && ($currentTemp - $minFutureTemp) >= self::TEMP_DROP_ALERT) {
            $drop = round($currentTemp - $minFutureTemp);
            $insights[] = [
                'type' => 'temperature',
                'icon' => 'mdi:thermometer-minus',
                'severity' => 'warning',
                'priority' => 70,
                'title' => 'Esfria à noite',
                'message' => "Temperatura cai {$drop}°C até " . ($minTempTime ? $minTempTime->format('H:i') : 'mais tarde'),
                'detail' => 'Leve um agasalho',
            ];
        }

        return $insights;
    }

    /**
     * Insight de UV
     */
    private function generateUVInsights(array $weather, Carbon $now): array
    {
        $insights = [];
        $hourly = $weather['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $uvs = $hourly['uv_index'] ?? [];

        if (empty($uvs)) {
            return $insights;
        }

        $maxUV = 0;
        $maxUVTime = null;

        for ($i = 0; $i < min(24, count($times)); $i++) {
            $time = Carbon::parse($times[$i]);
            if ($time->lt($now))
                continue;

            $uv = $uvs[$i] ?? 0;
            if ($uv > $maxUV) {
                $maxUV = $uv;
                $maxUVTime = $time;
            }
        }

        if ($maxUV >= self::UV_EXTREME) {
            $insights[] = [
                'type' => 'uv',
                'icon' => 'mdi:white-balance-sunny',
                'severity' => 'danger',
                'priority' => 85,
                'title' => 'UV extremo',
                'message' => "Índice UV {$maxUV} - evite exposição ao sol",
                'detail' => 'Protetor solar, chapéu e sombra obrigatórios',
            ];
        } elseif ($maxUV >= self::UV_VERY_HIGH) {
            $insights[] = [
                'type' => 'uv',
                'icon' => 'mdi:white-balance-sunny',
                'severity' => 'warning',
                'priority' => 55,
                'title' => 'UV muito alto',
                'message' => "Índice UV {$maxUV}" . ($maxUVTime ? " às " . $maxUVTime->format('H:i') : ''),
                'detail' => 'Use protetor solar fator 30+',
            ];
        }

        return $insights;
    }

    /**
     * Insight do mar - "Mar tá como?"
     */
    private function generateMarineInsights(array $marine, Carbon $now): array
    {
        $insights = [];
        $hourly = $marine['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $waves = $hourly['wave_height'] ?? [];
        $periods = $hourly['wave_period'] ?? [];
        $seaTemps = $hourly['sea_surface_temperature'] ?? [];

        if (empty($waves)) {
            return $insights;
        }

        // Find current/avg wave conditions
        $currentIdx = 0;
        foreach ($times as $i => $time) {
            if (Carbon::parse($time)->gte($now)) {
                $currentIdx = $i;
                break;
            }
        }

        $currentWave = $waves[$currentIdx] ?? 0;
        $currentPeriod = $periods[$currentIdx] ?? 0;
        $seaTemp = $seaTemps[$currentIdx] ?? null;

        // Classify sea condition
        $condition = 'calm';
        $conditionPt = 'Calmo';
        $severity = 'success';
        $icon = '✅';

        if ($currentWave >= self::WAVE_ROUGH) {
            $condition = 'rough';
            $conditionPt = 'Agitado';
            $severity = 'danger';
            $icon = '⛔';
        } elseif ($currentWave >= self::WAVE_MODERATE) {
            $condition = 'moderate';
            $conditionPt = 'Moderado';
            $severity = 'warning';
            $icon = '⚠️';
        }

        $insights[] = [
            'type' => 'sea',
            'icon' => 'mdi:waves',
            'severity' => $severity,
            'priority' => 75,
            'title' => "Mar {$conditionPt}",
            'message' => "Ondas de " . number_format($currentWave, 1) . "m a cada {$currentPeriod}s",
            'detail' => $seaTemp ? "Temperatura do mar: " . round($seaTemp) . "°C" : null,
            'badge' => "{$icon} {$conditionPt}",
            'meta' => [
                'condition' => $condition,
                'wave_m' => $currentWave,
                'period_s' => $currentPeriod,
                'sea_temp_c' => $seaTemp,
            ],
        ];

        // Add coastal precision warning
        $insights[] = [
            'type' => 'warning',
            'icon' => 'mdi:information-outline',
            'severity' => 'info',
            'priority' => 10,
            'title' => 'Precisão limitada',
            'message' => 'Dados do mar têm precisão limitada perto da costa',
            'detail' => 'Não use para navegação. Consulte a Marinha para informações oficiais.',
        ];

        return $insights;
    }

    /**
     * Score de praia - "Dá praia?"
     */
    private function generateBeachScore(array $weather, array $marine, Carbon $now): ?array
    {
        $score = 10;
        $reasons = [];
        $positives = [];

        $hourly = $weather['hourly'] ?? [];
        $times = $hourly['time'] ?? [];
        $rainProbs = $hourly['precipitation_probability'] ?? [];
        $uvs = $hourly['uv_index'] ?? [];
        $winds = $hourly['wind_speed_10m'] ?? [];
        $clouds = $hourly['cloud_cover'] ?? [];

        $marineHourly = $marine['hourly'] ?? [];
        $waves = $marineHourly['wave_height'] ?? [];
        $seaTemps = $marineHourly['sea_surface_temperature'] ?? [];

        // Find current index
        $currentIdx = 0;
        foreach ($times as $i => $time) {
            if (Carbon::parse($time)->gte($now)) {
                $currentIdx = $i;
                break;
            }
        }

        // Check next 6 hours (beach afternoon)
        $avgRainProb = 0;
        $maxWind = 0;
        $avgCloud = 0;
        $count = 0;

        for ($i = $currentIdx; $i < min($currentIdx + 6, count($times)); $i++) {
            $avgRainProb += $rainProbs[$i] ?? 0;
            $maxWind = max($maxWind, $winds[$i] ?? 0);
            $avgCloud += $clouds[$i] ?? 0;
            $count++;
        }

        if ($count > 0) {
            $avgRainProb /= $count;
            $avgCloud /= $count;
        }

        // Rain penalty
        if ($avgRainProb >= 70) {
            $score -= 4;
            $reasons[] = 'Chuva muito provável';
        } elseif ($avgRainProb >= 50) {
            $score -= 2;
            $reasons[] = 'Chance de chuva';
        } else {
            $positives[] = 'Sem chuva prevista';
        }

        // Wind penalty
        if ($maxWind >= self::WIND_VERY_STRONG) {
            $score -= 3;
            $reasons[] = 'Vento muito forte';
        } elseif ($maxWind >= self::WIND_STRONG) {
            $score -= 1;
            $reasons[] = 'Vento moderado';
        }

        // Wave penalty
        $currentWave = $waves[$currentIdx] ?? 0;
        if ($currentWave >= self::WAVE_ROUGH) {
            $score -= 3;
            $reasons[] = 'Mar agitado';
        } elseif ($currentWave >= self::WAVE_MODERATE) {
            $score -= 1;
            $reasons[] = 'Mar moderado';
        } else {
            $positives[] = 'Mar calmo';
        }

        // UV consideration (too high is bad, but some sun is good)
        $currentUV = $uvs[$currentIdx] ?? 0;
        if ($currentUV >= self::UV_EXTREME) {
            $score -= 1;
            $reasons[] = 'UV extremo';
        } elseif ($currentUV >= self::UV_HIGH && $currentUV < self::UV_VERY_HIGH) {
            $positives[] = 'Sol bom (use protetor)';
        }

        // Cloud cover
        if ($avgCloud < 30) {
            $positives[] = 'Céu aberto';
        } elseif ($avgCloud > 80) {
            $score -= 1;
            $reasons[] = 'Muito nublado';
        }

        // Sea temperature bonus
        $seaTemp = $seaTemps[$currentIdx] ?? null;
        if ($seaTemp && $seaTemp >= 24) {
            $positives[] = "Água {$seaTemp}°C";
        }

        $score = max(0, min(10, $score));

        // Generate verdict
        $verdict = match (true) {
            $score >= 8 => 'Excelente para praia!',
            $score >= 6 => 'Bom dia de praia',
            $score >= 4 => 'Razoável, fique atento',
            default => 'Não recomendado hoje',
        };

        $severity = match (true) {
            $score >= 8 => 'success',
            $score >= 6 => 'info',
            $score >= 4 => 'warning',
            default => 'danger',
        };

        return [
            'type' => 'beach',
            'icon' => 'mdi:beach',
            'severity' => $severity,
            'priority' => 95,
            'title' => 'Dá praia?',
            'message' => $verdict,
            'detail' => !empty($reasons) ? implode(', ', $reasons) : implode(', ', array_slice($positives, 0, 2)),
            'meta' => [
                'score' => $score,
                'positives' => $positives,
                'negatives' => $reasons,
            ],
        ];
    }

    /**
     * Gera preset específico
     */
    public function generatePreset(string $type, array $weatherData, array $marineData): array
    {
        $now = Carbon::now('America/Sao_Paulo');
        $weather = $weatherData['data'] ?? [];
        $marine = $marineData['data'] ?? [];

        return match ($type) {
            'going_out' => $this->presetGoingOut($weather, $now),
            'beach' => $this->presetBeach($weather, $marine, $now),
            'fishing' => $this->presetFishing($weather, $marine, $now),
            'hiking' => $this->presetHiking($weather, $now),
            default => [],
        };
    }

    private function presetGoingOut(array $weather, Carbon $now): array
    {
        return [
            'type' => 'preset',
            'name' => 'going_out',
            'title' => 'Vou sair de casa',
            'focus' => ['rain', 'temperature', 'wind'],
            'insights' => array_merge(
                $this->generateRainInsights($weather, $now),
                $this->generateTemperatureInsights($weather, $now),
                $this->generateWindInsights($weather, $now)
            ),
        ];
    }

    private function presetBeach(array $weather, array $marine, Carbon $now): array
    {
        $beachScore = $this->generateBeachScore($weather, $marine, $now);

        return [
            'type' => 'preset',
            'name' => 'beach',
            'title' => 'Quero ir à praia',
            'focus' => ['beach', 'sea', 'uv', 'wind'],
            'insights' => array_filter([
                $beachScore,
                ...$this->generateMarineInsights($marine, $now),
                ...$this->generateUVInsights($weather, $now),
                ...$this->generateWindInsights($weather, $now),
            ]),
        ];
    }

    private function presetFishing(array $weather, array $marine, Carbon $now): array
    {
        return [
            'type' => 'preset',
            'name' => 'fishing',
            'title' => 'Vou pescar',
            'focus' => ['sea', 'wind', 'rain'],
            'insights' => array_merge(
                $this->generateMarineInsights($marine, $now),
                $this->generateWindInsights($weather, $now),
                $this->generateRainInsights($weather, $now)
            ),
        ];
    }

    private function presetHiking(array $weather, Carbon $now): array
    {
        return [
            'type' => 'preset',
            'name' => 'hiking',
            'title' => 'Vou fazer trilha',
            'focus' => ['rain', 'temperature', 'wind', 'uv'],
            'insights' => array_merge(
                $this->generateRainInsights($weather, $now),
                $this->generateTemperatureInsights($weather, $now),
                $this->generateWindInsights($weather, $now),
                $this->generateUVInsights($weather, $now)
            ),
        ];
    }
}
