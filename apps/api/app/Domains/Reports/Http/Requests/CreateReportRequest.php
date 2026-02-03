<?php

namespace App\Domains\Reports\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateReportRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Auth checked by middleware
    }

    public function rules(): array
    {
        return [
            // Required fields
            'categoryId' => 'required|uuid|exists:report_categories,id',
            'title' => 'required|string|min:5|max:200',
            'description' => 'nullable|string|max:2000',

            // Location (optional but recommended)
            'addressText' => 'nullable|string|max:500',
            'addressSource' => 'nullable|in:gps,manual,mapa',
            'locationQuality' => 'nullable|in:precisa,aproximada,manual',
            'latitude' => 'nullable|numeric|between:-90,90',
            'longitude' => 'nullable|numeric|between:-180,180',
            'locationAccuracyM' => 'nullable|integer|min:0|max:10000',

            // Bairro
            'bairroId' => 'nullable|uuid|exists:bairros,id',

            // Images (multipart)
            'images' => 'nullable|array|max:3',
            'images.*' => 'image|mimes:jpeg,png,webp|max:15360', // 15MB max
        ];
    }

    public function messages(): array
    {
        return [
            'categoryId.required' => 'Selecione uma categoria para a denúncia.',
            'categoryId.exists' => 'Categoria inválida.',
            'title.required' => 'Informe um título para a denúncia.',
            'title.min' => 'O título deve ter pelo menos 5 caracteres.',
            'title.max' => 'O título não pode ter mais de 200 caracteres.',
            'description.max' => 'A descrição não pode ter mais de 2000 caracteres.',
            'images.max' => 'Você pode enviar no máximo 3 imagens.',
            'images.*.max' => 'Cada imagem pode ter no máximo 15MB.',
            'images.*.mimes' => 'Formato de imagem inválido. Use JPEG, PNG ou WebP.',
        ];
    }
}
