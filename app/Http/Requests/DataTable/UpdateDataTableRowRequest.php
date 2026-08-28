<?php

namespace App\Http\Requests\DataTable;

class UpdateDataTableRowRequest extends StoreDataTableRowRequest
{
    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        return ['values' => ['required', 'array', 'min:1']];
    }
}
