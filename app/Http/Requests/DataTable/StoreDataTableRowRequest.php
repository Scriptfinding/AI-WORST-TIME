<?php

namespace App\Http\Requests\DataTable;

use App\Enums\Authorization\Ability;
use App\Models\DataTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;

class StoreDataTableRowRequest extends FormRequest
{
    public function authorize(): bool
    {
        $dataTable = $this->route('dataTable');

        return $dataTable instanceof DataTable
            && $dataTable->workspace_id === session('current_workspace_id')
            && Gate::forUser($this->user())->allows(Ability::UPDATE->value, $dataTable);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['values' => ['present', 'array']];
    }
}
