<?php

namespace App\Http\Requests\DataTable;

use App\Enums\Authorization\Ability;
use App\Enums\DataTableColumnType;
use App\Models\DataTable;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreDataTableColumnRequest extends FormRequest
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
        $dataTable = $this->route('dataTable');

        return [
            'name' => [
                'required', 'string', 'max:63', 'regex:/^[A-Za-z][A-Za-z0-9_]{0,62}$/',
                Rule::unique('data_table_columns', 'name')
                    ->where('data_table_id', $dataTable instanceof DataTable ? $dataTable->id : ''),
                Rule::notIn(['id', 'ID', 'created_at', 'CREATED_AT', 'updated_at', 'UPDATED_AT']),
            ],
            'type' => ['required', Rule::enum(DataTableColumnType::class)],
            'position' => ['sometimes', 'integer', 'min:0'],
        ];
    }
}
