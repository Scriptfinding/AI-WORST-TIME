<?php

namespace App\Http\Requests\DataTable;

use App\Enums\Authorization\Ability;
use App\Models\DataTableColumn;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateDataTableColumnRequest extends FormRequest
{
    public function authorize(): bool
    {
        $column = $this->route('dataTableColumn');
        $dataTable = $column instanceof DataTableColumn ? $column->dataTable : null;

        return $dataTable !== null
            && $dataTable->workspace_id === session('current_workspace_id')
            && Gate::forUser($this->user())->allows(Ability::UPDATE->value, $dataTable);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $column = $this->route('dataTableColumn');

        return [
            'name' => [
                'sometimes', 'string', 'max:63', 'regex:/^[A-Za-z][A-Za-z0-9_]{0,62}$/',
                Rule::unique('data_table_columns', 'name')
                    ->where('data_table_id', $column instanceof DataTableColumn ? $column->data_table_id : '')
                    ->ignore($column instanceof DataTableColumn ? $column->id : null),
            ],
            'position' => ['sometimes', 'integer', 'min:0'],
            'type' => ['prohibited'],
        ];
    }
}
