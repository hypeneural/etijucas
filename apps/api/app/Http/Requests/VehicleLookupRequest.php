<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VehicleLookupRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true; // Public endpoint
    }

    /**
     * Get the validation rules that apply to the request.
     */
    public function rules(): array
    {
        return [
            'plate' => ['required', 'string', 'min:7', 'max:20'],
            'refresh' => ['sometimes', 'boolean'],
            'sections' => ['sometimes', 'array'],
            'sections.*' => ['in:basic,extra,fipe'],
        ];
    }

    /**
     * Get custom messages for validation errors.
     */
    public function messages(): array
    {
        return [
            'plate.required' => 'A placa é obrigatória.',
            'plate.min' => 'A placa deve ter pelo menos 7 caracteres.',
            'sections.*.in' => 'Seção inválida. Use: basic, extra ou fipe.',
        ];
    }

    /**
     * Normalize and return the plate.
     */
    public function plateNormalized(): string
    {
        $plate = strtoupper($this->input('plate', ''));
        $plate = preg_replace('/[^A-Z0-9]/', '', $plate);
        return substr($plate, 0, 7);
    }

    /**
     * Detect plate type based on format.
     */
    public function plateType(string $plate): string
    {
        // Old format: ABC1234
        if (preg_match('/^[A-Z]{3}\d{4}$/', $plate)) {
            return 'old';
        }

        // Mercosul format: ABC1D23
        if (preg_match('/^[A-Z]{3}\d[A-Z]\d{2}$/', $plate)) {
            return 'mercosul';
        }

        return 'invalid';
    }

    /**
     * Get requested sections (defaults to all).
     */
    public function getSections(): array
    {
        return $this->input('sections', ['basic', 'extra', 'fipe']);
    }

    /**
     * Check if refresh is requested.
     */
    public function wantsRefresh(): bool
    {
        return (bool) $this->input('refresh', false);
    }
}
