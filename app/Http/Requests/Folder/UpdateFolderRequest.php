<?php

namespace App\Http\Requests\Folder;

use App\Enums\Authorization\Ability;
use App\Models\Folder;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class UpdateFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $folder = $this->route('folder');

        return $folder instanceof Folder
            && Gate::allows(Ability::UPDATE->value, $folder);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        /** @var Folder $folder */
        $folder = $this->route('folder');

        return [
            'name' => ['sometimes', 'string', 'max:255'],
            'parent_id' => [
                'nullable',
                'string',
                Rule::exists('folders', 'id')->where('workspace_id', $folder->workspace_id),
            ],
            'sort_order' => ['sometimes', 'integer'],
            'is_shared' => ['sometimes', 'boolean'],
        ];
    }
}
