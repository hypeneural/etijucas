<?php

declare(strict_types=1);

namespace App\Domains\Weather\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Validator;

class WeatherBundleRequest extends FormRequest
{
    private const ALLOWED_SECTIONS = ['current', 'hourly', 'daily', 'marine', 'insights'];

    public function authorize(): bool
    {
        return true;
    }

    protected function prepareForValidation(): void
    {
        if (!$this->has('sections')) {
            $this->merge(['sections' => 'current,hourly,daily,insights']);
        }
    }

    public function rules(): array
    {
        return [
            'sections' => ['required', 'string'],
            'days' => ['nullable', 'integer', 'min:1', 'max:16'],
            'units' => ['nullable', 'in:metric,imperial'],
        ];
    }

    public function withValidator(Validator $validator): void
    {
        $validator->after(function (Validator $validator): void {
            $invalid = array_filter($this->sections(), fn(string $section): bool => !in_array($section, self::ALLOWED_SECTIONS, true));

            if ($invalid !== []) {
                $validator->errors()->add(
                    'sections',
                    'Invalid section(s): ' . implode(', ', $invalid)
                );
            }
        });
    }

    /**
     * @return array<int, string>
     */
    public function sections(): array
    {
        $raw = (string) $this->input('sections', 'current,hourly,daily,insights');
        $items = array_filter(array_map(
            static fn(string $part): string => strtolower(trim($part)),
            explode(',', $raw)
        ));
        $unique = array_values(array_unique($items));
        sort($unique);

        return $unique;
    }

    public function days(): int
    {
        return (int) $this->input('days', 7);
    }

    public function units(): string
    {
        return (string) $this->input('units', 'metric');
    }
}
