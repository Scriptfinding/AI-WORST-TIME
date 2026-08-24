<?php

namespace App\Http\Controllers\Api;

use App\DTO\Workspace\WorkspaceMutationData;
use App\Enums\Authorization\Ability;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Workspace;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Workspace\WorkspaceProvisioner;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class WorkspaceApiController extends Controller
{
    public function __construct(
        private FeatureFlagService $features,
        private WorkspaceProvisioner $workspaceProvisioner,
    ) {}

    public function index(Request $request): JsonResponse
    {
        Gate::authorize(Ability::VIEW_ANY->value, Workspace::class);

        /** @var User $user */
        $user = $request->user();
        $query = $this->visibleWorkspacesQuery($user)
            ->withCount(['flows', 'users'])
            ->orderBy('name');

        if ($search = $request->string('search')->toString()) {
            $query->where(function ($q) use ($search) {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('slug', 'like', "%{$search}%")
                    ->orWhere('lookup_key', 'like', "%{$search}%")
                    ->orWhere('id', 'like', "%{$search}%");
            });
        }

        $limit = min(max($request->integer('limit', 50), 1), 100);

        return response()->json(
            $query->limit($limit)->get()->map(fn (Workspace $workspace) => $this->serializeWorkspace($workspace))->values()
        );
    }

    public function store(Request $request): JsonResponse
    {
        /** @var User $user */
        $user = $request->user();
        $lookupKey = $request->input('lookup_key');
        $existingWorkspace = null;

        if ($lookupKey !== null) {
            validator(
                ['lookup_key' => $lookupKey],
                ['lookup_key' => $this->lookupKeyRules(enforceUnique: false)],
            )->validate();

            $existingWorkspace = Workspace::where('lookup_key', $lookupKey)->first();
        }

        $data = WorkspaceMutationData::fromValidated(
            $this->validateWorkspacePayload(
                $request,
                requireName: $existingWorkspace === null,
                workspace: $existingWorkspace,
            ),
        )->normalized(
            $existingWorkspace ?? new Workspace,
            $this->features,
            clearIconUploadPathWhenNotUpload: true,
        );
        if ($existingWorkspace) {
            if (Gate::forUser($user)->denies(Ability::UPDATE->value, $existingWorkspace)) {
                return response()->json(['error' => 'Forbidden.'], 403);
            }
        } elseif (Gate::forUser($user)->denies(Ability::CREATE->value, Workspace::class)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        try {
            $workspace = $lookupKey === null
                ? $this->workspaceProvisioner->create($user, $data, $user)
                : $this->workspaceProvisioner->upsertByLookupKey($user, $data, $user);
        } catch (\Symfony\Component\HttpKernel\Exception\HttpException $e) {
            return response()->json(['error' => $e->getMessage() ?: 'Workspace limit reached.'], $e->getStatusCode());
        }

        $user->rememberWorkspace($workspace);

        $workspace->loadCount(['flows', 'users']);

        return response()->json(
            $this->serializeWorkspace($workspace),
            $workspace->wasRecentlyCreated ? 201 : 200,
        );
    }

    public function show(Request $request, string $workspace): JsonResponse
    {
        $resolvedWorkspace = $this->resolveWorkspace($workspace);

        if (! $resolvedWorkspace || Gate::forUser($request->user())->denies(Ability::VIEW->value, $resolvedWorkspace)) {
            return response()->json(['error' => 'Workspace not found.'], 404);
        }

        $resolvedWorkspace->loadCount(['flows', 'users']);

        return response()->json($this->serializeWorkspace($resolvedWorkspace));
    }

    public function update(Request $request, string $workspace): JsonResponse
    {
        $resolvedWorkspace = $this->resolveWorkspace($workspace);

        if (! $resolvedWorkspace) {
            return response()->json(['error' => 'Workspace not found.'], 404);
        }

        if (Gate::forUser($request->user())->denies(Ability::UPDATE->value, $resolvedWorkspace)) {
            return response()->json(['error' => 'Forbidden.'], 403);
        }

        $data = WorkspaceMutationData::fromValidated(
            $this->validateWorkspacePayload($request, requireName: false, workspace: $resolvedWorkspace),
        )->normalized(
            $resolvedWorkspace,
            $this->features,
            clearIconUploadPathWhenNotUpload: true,
        );

        $resolvedWorkspace = $this->workspaceProvisioner->update($resolvedWorkspace, $data);
        $resolvedWorkspace->loadCount(['flows', 'users']);

        return response()->json($this->serializeWorkspace($resolvedWorkspace));
    }

    /**
     * @return Builder<Workspace>
     */
    private function visibleWorkspacesQuery(User $user): Builder
    {
        $query = Workspace::query();

        if (! $user->isAdmin()) {
            $query->whereIn('id', $user->workspaces()->select('workspaces.id'))
                ->where(function (Builder $query) {
                    $query->whereNull('expires_at')
                        ->orWhere('expires_at', '>', now());
                });
        }

        return $query;
    }

    /**
     * @return array<string, list<mixed>>
     */
    private function workspaceRules(bool $requireName, ?Workspace $workspace = null): array
    {
        return [
            'name' => [$requireName ? 'required' : 'sometimes', 'string', 'max:255'],
            'lookup_key' => $this->lookupKeyRules($workspace),
            'expires_at' => ['sometimes', 'nullable', 'date'],
            'runs_retention_default' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'runs_retention_max' => ['sometimes', 'integer', 'min:0', 'max:100000'],
            'default_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_flow_timeout_seconds' => ['sometimes', 'integer', 'min:0', 'max:9999999'],
            'max_retries_default' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'max_retries_max' => ['sometimes', 'integer', 'min:0', 'max:255'],
            'viewport_width' => ['sometimes', 'integer', 'min:320', 'max:3840'],
            'viewport_height' => ['sometimes', 'integer', 'min:200', 'max:2160'],
            'keyboard_speed' => ['sometimes', 'integer', 'min:0', 'max:10000'],
            'icon_type' => ['sometimes', Rule::in(['emoji', 'color'])],
            'icon_value' => ['nullable', 'string', 'max:100'],
            'icon_color' => ['nullable', 'string', 'max:7'],
            'allow_trigger_advertising' => ['sometimes', 'boolean'],
            'require_two_factor' => ['sometimes', 'boolean'],
            'default_flow_code' => ['sometimes', 'nullable', 'string', 'max:65000'],
        ];
    }

    /**
     * @return list<mixed>
     */
    private function lookupKeyRules(?Workspace $workspace = null, bool $enforceUnique = true): array
    {
        $rules = [
            'sometimes',
            'nullable',
            'string',
            'max:255',
            'regex:/^[a-z][a-z0-9_-]*$/',
        ];

        if ($enforceUnique) {
            $rules[] = Rule::unique('workspaces', 'lookup_key')->ignore($workspace?->id);
        }

        return $rules;
    }

    /**
     * @return array<string, mixed>
     */
    private function validateWorkspacePayload(Request $request, bool $requireName, ?Workspace $workspace = null): array
    {
        $preferences = $request->input('preferences', []);
        $appearance = $request->input('appearance', []);

        $payload = [
            ...(is_array($preferences) ? $preferences : []),
            ...(is_array($appearance) ? $appearance : []),
            ...$request->except(['preferences', 'appearance']),
        ];

        return validator($payload, $this->workspaceRules($requireName, $workspace))->validate();
    }

    private function resolveWorkspace(string $identifier): ?Workspace
    {
        $workspace = Workspace::where('id', $identifier)->first();
        if ($workspace) {
            return $workspace;
        }

        return Workspace::where('lookup_key', $identifier)->first();
    }

    /**
     * @return array<string, mixed>
     */
    private function serializeWorkspace(Workspace $workspace): array
    {
        $workspace->loadMissing('owner:id');

        return [
            'id' => $workspace->id,
            'name' => $workspace->name,
            'slug' => $workspace->slug,
            'lookup_key' => $workspace->lookup_key,
            'owner_id' => $workspace->owner?->id,
            'expires_at' => $workspace->expires_at?->toIso8601String(),
            'preferences' => [
                'runs_retention_default' => $workspace->runs_retention_default,
                'runs_retention_max' => $workspace->runs_retention_max,
                'default_flow_timeout_seconds' => $workspace->default_flow_timeout_seconds,
                'max_flow_timeout_seconds' => $workspace->max_flow_timeout_seconds,
                'max_retries_default' => $workspace->max_retries_default,
                'max_retries_max' => $workspace->max_retries_max,
                'viewport_width' => $workspace->viewport_width,
                'viewport_height' => $workspace->viewport_height,
                'keyboard_speed' => $workspace->keyboard_speed,
                'allow_trigger_advertising' => (bool) $workspace->allow_trigger_advertising,
                'require_two_factor' => $this->features->enabled('two_factor_enforcement_enabled')
                    && (bool) $workspace->require_two_factor,
                'default_flow_code' => $workspace->default_flow_code,
            ],
            'appearance' => [
                'icon_type' => $workspace->icon_type,
                'icon_value' => $workspace->icon_value,
                'icon_color' => $workspace->icon_color,
                'icon_url' => $workspace->icon_url,
            ],
            'flows_count' => $workspace->flows_count ?? null,
            'users_count' => $workspace->users_count ?? null,
            'created_at' => $workspace->created_at?->toIso8601String(),
            'updated_at' => $workspace->updated_at?->toIso8601String(),
        ];
    }
}
