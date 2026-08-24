<?php

namespace App\Http\Requests\Folder;

use App\Enums\Authorization\Ability;
use App\Models\Folder;
use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class StoreFolderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $workspace = Workspace::find(session('current_workspace_id'));

        return $workspace !== null
            && Gate::allows(Ability::CREATE->value, [Folder::class, $workspace]);
    }

    /** @return array<string, list<mixed>> */
    public function rules(): array
    {
        $sessionWorkspaceId = session('current_workspace_id');
        $workspaceId = is_string($sessionWorkspaceId) ? $sessionWorkspaceId : '';

        return [
            'name' => ['required', 'string', 'max:255'],
            'parent_id' => [
                'nullable',
                'string',
                Rule::exists('folders', 'id')->where('workspace_id', $workspaceId),
            ],
            'is_shared' => ['sometimes', 'boolean'],
            'owner_id' => ['nullable', 'string', 'exists:users,id'],
            'team_id' => [
                'nullable',
                Rule::exists('workspace_teams', 'id')->where('workspace_id', $workspaceId),
            ],
        ];
    }
}
