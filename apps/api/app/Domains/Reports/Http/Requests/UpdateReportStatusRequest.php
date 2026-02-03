<?php

namespace App\Domains\Reports\Http\Requests;

use App\Domains\Reports\Enums\ReportStatus;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rules\Enum;

class UpdateReportStatusRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->hasAnyRole(['admin', 'moderator']);
    }

    public function rules(): array
    {
        return [
            'status' => ['required', new Enum(ReportStatus::class)],
            'note' => 'nullable|string|max:500',
        ];
    }

    public function messages(): array
    {
        return [
            'status.required' => 'Informe o novo status.',
            'status.Illuminate\Validation\Rules\Enum' => 'Status inválido.',
            'note.max' => 'A observação não pode ter mais de 500 caracteres.',
        ];
    }
}
