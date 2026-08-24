<?php

/*
 * Explicit proprietary scope: the paid shared mailbox-watcher scopes in this file implement paid
 * Puppetflow features and are licensed under the Puppetflow Proprietary License.
 * See LICENSE_PROPRIETARY.md.
 */

namespace App\Http\Controllers\Flow;

use App\Authorization\AuthorizationContext;
use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ResourceAssignmentValidator;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\DTO\Mailbox\MailboxWatcherCreateData;
use App\DTO\Mailbox\MailboxWatcherPatchData;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Enums\Integration\IntegrationOtherProviderEnum;
use App\Enums\Mailbox\MailboxWatcherRuleField;
use App\Enums\Mailbox\MailboxWatcherRuleOperator;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\MailboxWatcher;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\Rule;

class MailboxWatcherController extends Controller
{
    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly ResourceAssignmentValidator $assignments,
    ) {}

    public function index(Request $request, Flow $flow): JsonResponse
    {
        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);

        $context = $this->context($request, $flow);
        $query = $this->watchersQuery($flow)
            ->with('rules', 'mailbox.domain', 'user:id,name', 'team:id,name');
        if (! $this->features()->enabled('mailbox_enabled')) {
            $query->whereRaw('1 = 0');
        } else {
            $query->where('mailbox_watchers.stale', false)
                ->whereHas('mailbox', fn ($q) => $q->where('stale', false)->whereHas('domain', fn ($q2) => $q2->where('stale', false)));
        }

        $this->applyWatcherView($query, $context);
        $watchers = $query->get();
        $this->injectOwnerWorkspaceRoles($watchers, $flow->workspace_id);

        return response()->json($watchers);
    }

    public function store(Request $request, Flow $flow): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);
        Gate::authorize(Ability::CREATE->value, MailboxWatcher::class);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:100'],
            'mailbox_id' => 'required|string',
            'group' => 'nullable|string|max:100',
            'extract_enabled' => 'boolean',
            'extract_mode' => 'sometimes|string|in:regex,selector',
            'extract_expression' => 'nullable|string|max:500',
            'is_active' => 'boolean',
            'timeout' => 'nullable|integer|min:1000|max:86400000',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => 'nullable|string',
            'rules' => 'nullable|array',
            'rules.*.rule_group' => 'required|integer|min:0',
            'rules.*.field' => ['required', Rule::enum(MailboxWatcherRuleField::class)],
            'rules.*.operator' => ['required', Rule::enum(MailboxWatcherRuleOperator::class)],
            'rules.*.value' => 'required|string',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $flow->workspace_id);
        }
        $validated['mailbox_id'] = Mailbox::where('workspace_id', $flow->workspace_id)
            ->where('id', $validated['mailbox_id'])
            ->value('id');
        abort_unless(is_string($validated['mailbox_id']), 404);
        $data = MailboxWatcherCreateData::fromValidated($validated);

        $scope = $data->scope;
        $teamId = $scope === 'team' ? $data->teamId : null;
        /** @var User $user */
        $user = $request->user();
        $ownerId = $user->id;
        $this->assignments->validate($flow->workspace_id, $ownerId, $scope, $teamId, null, null);

        $mailbox = Mailbox::where('id', $data->mailboxId)
            ->where('workspace_id', $flow->workspace_id)
            ->where('stale', false)
            ->whereHas('domain', fn ($q) => $q->where('stale', false))
            ->firstOrFail();
        Gate::authorize(Ability::USE->value, $mailbox);

        $watcher = $flow->mailboxWatchers()->create($data->persistenceAttributes($ownerId, $teamId));

        if ($data->rules !== null) {
            foreach ($data->rules as $rule) {
                $watcher->rules()->create($rule->persistenceAttributes());
            }
        }

        $watcher->load('rules', 'mailbox.domain', 'user:id,name', 'team:id,name');
        $this->injectOwnerWorkspaceRoles([$watcher], $flow->workspace_id);

        return response()->json($watcher, 201);
    }

    public function update(Request $request, Flow $flow, MailboxWatcher $watcher): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->features()->abortIfStale($watcher);
        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);
        abort_unless($watcher->flow_id === $flow->id, 404);
        Gate::authorize(Ability::UPDATE->value, $watcher);

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:100'],
            'mailbox_id' => 'sometimes|string',
            'group' => 'nullable|string|max:100',
            'extract_enabled' => 'sometimes|boolean',
            'extract_mode' => 'sometimes|string|in:regex,selector',
            'extract_expression' => 'nullable|string|max:500',
            'is_active' => 'sometimes|boolean',
            'timeout' => 'nullable|integer|min:1000|max:86400000',
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => 'nullable|string',
            'user_id' => 'nullable|string|exists:users,id',
            'rules' => 'nullable|array',
            'rules.*.rule_group' => 'required|integer|min:0',
            'rules.*.field' => ['required', Rule::enum(MailboxWatcherRuleField::class)],
            'rules.*.operator' => ['required', Rule::enum(MailboxWatcherRuleOperator::class)],
            'rules.*.value' => 'required|string',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $flow->workspace_id);
        }
        if (array_key_exists('mailbox_id', $validated)) {
            $mailboxId = Mailbox::where('workspace_id', $flow->workspace_id)
                ->where('id', $validated['mailbox_id'])
                ->value('id');
            abort_unless(is_string($mailboxId), 404);
            $validated['mailbox_id'] = $mailboxId;
        }
        $data = MailboxWatcherPatchData::fromValidated($validated);
        $attributes = $data->persistenceAttributes();

        $validatedScope = $data->scope;
        $validatedTeamId = $data->teamId;
        if (
            ($validatedScope !== null && $validatedScope !== $watcher->scope)
            || ($data->has('team_id') && $validatedTeamId !== $watcher->team_id)
        ) {
            Gate::authorize(Ability::MANAGE_SCOPE->value, $watcher);
        }

        $targetScope = $data->scope ?? $watcher->scope;
        $targetTeamId = null;
        if ($targetScope === 'team') {
            $targetTeamId = $data->teamId ?? $watcher->team_id;
            $attributes['team_id'] = $targetTeamId;
        } elseif ($data->has('scope') || $data->has('team_id')) {
            $attributes['team_id'] = null;
        }

        /** @var User $user */
        $user = $request->user();
        $ownerData = $data->ownerData();
        $ownerId = $this->resolveOwnerId($ownerData, $flow->workspace_id, $watcher->user_id ?? $user->id);
        if (array_key_exists('user_id', $ownerData)) {
            $attributes['user_id'] = $ownerData['user_id'];
        }
        if ($data->mailboxId !== null) {
            $mailbox = Mailbox::where('id', $data->mailboxId)
                ->where('workspace_id', $flow->workspace_id)
                ->where('stale', false)
                ->whereHas('domain', fn ($q) => $q->where('stale', false))
                ->firstOrFail();
            Gate::authorize(Ability::USE->value, $mailbox);
        }

        DB::transaction(function () use (
            $watcher,
            $data,
            $attributes,
            $flow,
            $ownerId,
            $targetScope,
            $targetTeamId,
        ) {
            $this->assignments->validate(
                $flow->workspace_id,
                $ownerId,
                $targetScope,
                $targetTeamId,
                null,
                null,
            );
            $watcher->update($attributes);

            if ($data->has('rules')) {
                $watcher->rules()->delete();
                foreach ($data->rules ?? [] as $rule) {
                    $watcher->rules()->create($rule->persistenceAttributes());
                }
            }
        });

        $watcher->load('rules', 'mailbox.domain', 'user:id,name', 'team:id,name');
        $this->injectOwnerWorkspaceRoles([$watcher], $flow->workspace_id);

        return response()->json($watcher->toArray());
    }

    public function destroy(Request $request, Flow $flow, MailboxWatcher $watcher): JsonResponse
    {
        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);
        abort_unless($watcher->flow_id === $flow->id, 404);
        Gate::authorize(Ability::DELETE->value, $watcher);

        $watcher->delete();

        return response()->json(['message' => 'Watcher deleted.']);
    }

    public function destroyBatch(Request $request, Flow $flow): JsonResponse
    {
        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);

        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => [
                'string',
                'distinct',
                Rule::exists('mailbox_watchers', 'id')->where('flow_id', $flow->id),
            ],
        ]);

        /** @var list<string> $ids */
        $ids = $validated['ids'];
        $watchers = MailboxWatcher::query()->where('flow_id', $flow->id)->whereIn('id', $ids)->orderBy('id')->get();

        foreach ($watchers as $watcher) {
            Gate::authorize(Ability::DELETE->value, $watcher);
        }

        DB::transaction(fn () => $watchers->each->delete(), 3);

        return response()->json([
            'message' => $watchers->count() === 1
                ? 'Watcher deleted.'
                : $watchers->count().' watchers deleted.',
        ]);
    }

    public function suggestions(Request $request, Flow $flow): JsonResponse
    {
        if (! $this->features()->enabled('mailbox_enabled')) {
            return response()->json([]);
        }

        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);
        $context = $this->context($request, $flow);

        $query = $this->watchersQuery($flow);
        $query->where('mailbox_watchers.stale', false)
            ->where('mailbox_watchers.is_active', true)
            ->whereHas('mailbox', function ($query) use ($context) {
                $query->where('stale', false)
                    ->whereHas('domain', fn ($domain) => $domain->where('stale', false));
                $this->sharedVisibility->applyUse($query, $context);
            })
            ->with(['mailbox.domain', 'mailbox.team:id,name'])
            ->orderBy('mailbox_watchers.name');
        $this->applyWatcherUse($query, $context);
        $watchers = $query->get()
            ->map(function (MailboxWatcher $watcher): array {
                $mailbox = $watcher->mailbox;
                abort_unless($mailbox instanceof Mailbox, 500, 'The watcher mailbox is unavailable.');

                return [
                    'id' => $watcher->id,
                    'name' => $watcher->name,
                    'address' => $mailbox->address(),
                    'scope' => $mailbox->scope,
                    'team_name' => $mailbox->team?->name,
                ];
            });

        return response()->json($watchers);
    }

    public function setupStatus(Request $request, Flow $flow): JsonResponse
    {
        if (! $this->features()->enabled('mailbox_enabled')) {
            return response()->json([
                'has_mailbox_integration' => false,
                'has_mailbox' => false,
            ]);
        }

        $this->assertFlowWorkspace($flow);
        $this->authorize(Ability::VIEW->value, $flow);
        $context = $this->context($request, $flow);

        $integrationsQuery = Integration::query()
            ->where('workspace_id', $flow->workspace_id)
            ->where('category', IntegrationCategoryEnum::OTHER)
            ->where('provider', IntegrationOtherProviderEnum::MAILBOX->value)
            ->where('is_active', true)
            ->where('stale', false);
        $this->sharedVisibility->applyUse($integrationsQuery, $context);

        $mailboxesQuery = Mailbox::query()
            ->where('workspace_id', $flow->workspace_id)
            ->where('is_active', true)
            ->where('stale', false)
            ->whereHas('domain', fn ($query) => $query->where('stale', false));
        $this->sharedVisibility->applyUse($mailboxesQuery, $context);

        return response()->json([
            'has_mailbox_integration' => $integrationsQuery->exists(),
            'has_mailbox' => $mailboxesQuery->exists(),
        ]);
    }

    /** @return Builder<MailboxWatcher> */
    private function watchersQuery(Flow $flow): Builder
    {
        return MailboxWatcher::query()
            ->select('mailbox_watchers.*')
            ->join('flows', 'flows.id', '=', 'mailbox_watchers.flow_id')
            ->where('mailbox_watchers.flow_id', $flow->id)
            ->whereHas('mailbox', fn ($mailbox) => $mailbox->where('workspace_id', $flow->workspace_id))
            ->where(function ($query) use ($flow) {
                $query->where('mailbox_watchers.scope', '!=', 'team')
                    ->orWhereHas('team', fn ($team) => $team->where('workspace_id', $flow->workspace_id));
            });
    }

    private function context(Request $request, Flow $flow): AuthorizationContext
    {
        /** @var User $user */
        $user = $request->user();

        return $this->authorizationContexts->for($user, $flow->workspace_id);
    }

    /** @param Builder<MailboxWatcher> $query */
    private function applyWatcherView(Builder $query, AuthorizationContext $context): void
    {
        $this->sharedVisibility->applyView(
            $query,
            $context,
            workspaceColumn: 'flows.workspace_id',
            ownerColumn: 'mailbox_watchers.user_id',
            scopeColumn: 'mailbox_watchers.scope',
            teamColumn: 'mailbox_watchers.team_id',
            includeUnowned: true,
        );
    }

    /** @param Builder<MailboxWatcher> $query */
    private function applyWatcherUse(Builder $query, AuthorizationContext $context): void
    {
        $this->sharedVisibility->applyUse(
            $query,
            $context,
            workspaceColumn: 'flows.workspace_id',
            ownerColumn: 'mailbox_watchers.user_id',
            scopeColumn: 'mailbox_watchers.scope',
            teamColumn: 'mailbox_watchers.team_id',
        );
    }

    private function assertFlowWorkspace(Flow $flow): void
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();
        abort_unless($flow->workspace_id === $currentWorkspaceId, 404);
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }
}
