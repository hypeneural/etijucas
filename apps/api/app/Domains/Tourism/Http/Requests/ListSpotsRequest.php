<?php

namespace App\Domains\Tourism\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class ListSpotsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'categoria' => ['sometimes', 'string', 'in:natureza,cultura,historia,gastronomia,aventura,praia,religioso,familia,compras,lazer'],
            'bairroId' => ['sometimes', 'uuid', 'exists:bairros,id'],
            'preco' => ['sometimes', 'string', 'in:gratis,barato,moderado,caro'],
            'rating' => ['sometimes', 'numeric', 'min:1', 'max:5'],
            'search' => ['sometimes', 'string', 'min:2', 'max:100'],
            'sortBy' => ['sometimes', 'string', 'in:rating,reviews,recent,popular'],
            'destaque' => ['sometimes', 'boolean'],
            'perPage' => ['sometimes', 'integer', 'min:1', 'max:50'],
        ];
    }
}
