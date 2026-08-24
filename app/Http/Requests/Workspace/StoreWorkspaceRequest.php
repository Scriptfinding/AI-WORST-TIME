<?php

namespace App\Http\Requests\Workspace;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Models\Workspace;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreWorkspaceRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->can(Ability::CREATE->value, Workspace::class) ?? false;
    }

    /** @return array<string, list<string>> */
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'expires_at' => [
                'sometimes',
                'nullable',
                'date',
                Rule::prohibitedIf(fn () => ! $this->user()?->isAdmin()),
            ],
        ];
    }

    public function mutationData(): WorkspaceMutationData
    {
        return WorkspaceMutationData::fromValidated($this->validated());
    }
}
