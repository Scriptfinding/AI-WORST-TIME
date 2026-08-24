<?php

namespace App\Services\Flow\Query;

use App\Authorization\AuthorizationContext;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\AiModel;
use App\Models\Flow;
use App\Models\FlowUserInput;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\MailboxDomain;
use App\Models\NotificationChannel;
use App\Models\User;
use App\Models\UserVariable;
use App\Models\WorkspaceTeam;
use App\Services\FeatureFlags\FeatureFlagService;

final class FlowEditorResourceProjection
{
    public function __construct(
        private readonly SharedResourceVisibility $visibility,
        private readonly FeatureFlagService $features,
        private readonly FlowOwnerRoleProjector $roles,
    ) {}

    /**
     * @param  list<string>  $teamIds
     * @return array<string, mixed>
     */
    public function get(Flow $flow, User $user, AuthorizationContext $context, array $teamIds, bool $canEdit): array
    {
        $myTriggers = $flow->triggers()->where('user_id', $user->id)->with('team:id,name')
            ->orderByRaw('COALESCE("group", \'\') ASC')->orderBy('label')->get();
        $myActions = $flow->actions()->where('user_id', $user->id)->with('team:id,name')
            ->orderByRaw('COALESCE("group", \'\') ASC')->orderBy('label')->get();

        if ($canEdit) {
            $otherTriggers = $flow->triggers()->where('user_id', '!=', $user->id);
            $otherActions = $flow->actions()->where('user_id', '!=', $user->id);
            if (! $context->isInstanceAdmin()) {
                $otherTriggers->where('scope', '!=', 'owner');
                $otherActions->where('scope', '!=', 'owner');
            }
            $otherTriggers = $otherTriggers->with('user:id,name', 'team:id,name')->get();
            $otherActions = $otherActions->with('user:id,name', 'team:id,name')->get();
        } else {
            $shared = function ($query) use ($teamIds) {
                $query->whereRaw('1 = 0');
                if ($this->features->workspaceSharingEnabled()) {
                    $query->orWhere('scope', 'workspace');
                }
                if ($this->features->teamsEnabled()) {
                    $query->orWhere(fn ($nested) => $nested->where('scope', 'team')->whereIn('team_id', $teamIds));
                }
            };
            $otherTriggers = $flow->triggers()->where('user_id', '!=', $user->id)
                ->where($shared)->with('user:id,name', 'team:id,name')->get();
            $otherActions = $flow->actions()->where('user_id', '!=', $user->id)
                ->where($shared)->with('user:id,name', 'team:id,name')->get();
        }

        // Hydrate the parent flow so per-item policy checks don't each
        // re-query flows for the workspace id (N+1). The relation is
        // removed after the checks to keep it out of the JSON payload.
        $children = $myTriggers->concat($otherTriggers)->concat($myActions)->concat($otherActions);
        $children->each(fn ($child) => $child->setRelation('flow', $flow));

        $myTriggers->concat($otherTriggers)->each(function ($trigger) use ($user) {
            if ($user->can(Ability::VIEW->value, $trigger) && $user->can(Ability::UPDATE->value, $trigger)) {
                $trigger->makeVisible(['config', 'token', 'endpoint_url']);
            }
        });
        $myActions->concat($otherActions)->each(function ($action) use ($user) {
            if ($user->can(Ability::VIEW->value, $action) && $user->can(Ability::UPDATE->value, $action)) {
                $action->makeVisible(['config']);
            }
        });
        $this->roles->models($children, $flow->workspace_id);
        $children->each(fn ($child) => $child->unsetRelation('flow'));

        $repositoryQuery = Integration::query()->where('category', 'repository')
            ->where('is_active', true)->where('stale', false)
            ->with('team:id')->orderBy('name');
        $this->visibility->applyUse($repositoryQuery, $context);
        $repositories = $this->features->enabled('vcs_enabled')
            ? $repositoryQuery->get()->filter(fn ($integration) => $integration->provider_status === 'connected')->values()
            : collect();

        $watchersQuery = $flow->mailboxWatchers()->getQuery()->select('mailbox_watchers.*')
            ->join('flows', 'flows.id', '=', 'mailbox_watchers.flow_id')
            ->with(['rules', 'mailbox.domain', 'user:id,name', 'team:id,name']);
        if (! $this->features->enabled('mailbox_enabled')) {
            $watchersQuery->whereRaw('1 = 0');
        } else {
            $watchersQuery->where('mailbox_watchers.stale', false)
                ->whereHas('mailbox', fn ($query) => $query->where('stale', false)
                    ->whereHas('domain', fn ($nested) => $nested->where('stale', false)));
        }
        $this->visibility->applyView(
            $watchersQuery,
            $context,
            workspaceColumn: 'flows.workspace_id',
            ownerColumn: 'mailbox_watchers.user_id',
            scopeColumn: 'mailbox_watchers.scope',
            teamColumn: 'mailbox_watchers.team_id',
            includeUnowned: true,
        );
        $watchers = $watchersQuery
            ->orderByRaw('COALESCE(mailbox_watchers."group", \'\') ASC, mailbox_watchers.name ASC')->get();
        $this->roles->models($watchers, $flow->workspace_id);

        $mailboxesQuery = Mailbox::query()->where('is_active', true)->where('stale', false)
            ->whereHas('domain', fn ($query) => $query->where('stale', false))->with('domain:id,name');
        $this->visibility->applyUse($mailboxesQuery, $context);

        $variableGroupsQuery = UserVariable::query()->where('stale', false);
        if (! $this->features->enabled('variables_enabled')) {
            $variableGroupsQuery->whereRaw('1 = 0');
        }
        $this->visibility->applyView($variableGroupsQuery, $context);

        // Vault, AI, and messenger integrations share filters and payload
        // shape, so one query covers the enabled categories.
        $categoryFlags = [
            IntegrationCategoryEnum::VAULT->value => 'vaults_enabled',
            IntegrationCategoryEnum::AI->value => 'ai_enabled',
            IntegrationCategoryEnum::MESSENGER->value => 'messenger_enabled',
        ];
        $enabledCategories = array_keys(array_filter(
            $categoryFlags,
            fn (string $flag): bool => $this->features->enabled($flag),
        ));
        $integrationsByCategory = collect();
        if ($enabledCategories !== []) {
            $sharedIntegrationsQuery = Integration::query()
                ->where('is_active', true)
                ->where('stale', false);
            $sharedIntegrationsQuery->whereIn('category', $enabledCategories);
            $this->visibility->applyUse($sharedIntegrationsQuery, $context);
            $integrationsByCategory = $sharedIntegrationsQuery
                ->get(['id', 'provider', 'name', 'category'])
                ->each(fn (Integration $integration) => $integration->makeHidden('category'))
                ->groupBy(fn (Integration $integration): string => $integration->category->value);
        }

        $mailboxIntegrationsQuery = Integration::query()
            ->where('category', IntegrationCategoryEnum::OTHER)
            ->where('provider', 'mailbox')
            ->where('is_active', true)
            ->where('stale', false)
            ->with('team:id');
        $this->visibility->applyUse($mailboxIntegrationsQuery, $context);

        $aiModelGroupsQuery = AiModel::query()->where('stale', false);
        $this->visibility->applyView($aiModelGroupsQuery, $context);

        $channelGroupsQuery = NotificationChannel::query()->where('stale', false);
        $this->visibility->applyView($channelGroupsQuery, $context);

        return [
            'myManualInput' => FlowUserInput::where('flow_id', $flow->id)->where('user_id', $user->id)->value('input'),
            'myTriggers' => $myTriggers,
            'myActions' => $myActions,
            'triggerGroups' => $myTriggers->pluck('group')->filter()->unique()->sort()->values(),
            'actionGroups' => $myActions->pluck('group')->filter()->unique()->sort()->values(),
            'otherTriggers' => $otherTriggers,
            'otherActions' => $otherActions,
            'teams' => $this->features->teamsEnabled()
                ? WorkspaceTeam::where('workspace_id', $flow->workspace_id)->orderBy('name')->get(['id', 'name'])
                : collect(),
            'variableGroups' => $variableGroupsQuery->whereNotNull('group')->distinct()
                ->pluck('group')->sort()->values(),
            'vaultIntegrations' => $integrationsByCategory->get(IntegrationCategoryEnum::VAULT->value, collect()),
            'aiIntegrations' => $integrationsByCategory->get(IntegrationCategoryEnum::AI->value, collect()),
            'messengerIntegrations' => $integrationsByCategory->get(IntegrationCategoryEnum::MESSENGER->value, collect()),
            'mailboxIntegrations' => $this->features->enabled('mailbox_enabled')
                ? $mailboxIntegrationsQuery->get()
                : collect(),
            'mailboxDomains' => $this->features->enabled('mailbox_enabled')
                ? MailboxDomain::where('workspace_id', $flow->workspace_id)
                    ->where('is_verified', true)
                    ->where('is_active', true)
                    ->where('stale', false)
                    ->orderBy('name')
                    ->get(['id', 'name'])
                : collect(),
            'aiModelGroups' => $aiModelGroupsQuery->whereNotNull('group')
                ->distinct()->pluck('group')->sort()->values(),
            'channelGroups' => $channelGroupsQuery->whereNotNull('group')
                ->distinct()->pluck('group')->sort()->values(),
            'mailboxGroups' => Mailbox::where('workspace_id', $flow->workspace_id)
                ->where('stale', false)
                ->whereNotNull('group')
                ->distinct()
                ->pluck('group')
                ->sort()
                ->values(),
            'repositoryIntegrations' => $repositories,
            'mailboxWatchers' => $watchers,
            'watcherGroups' => $watchers->pluck('group')->filter()->unique()->sort()->values(),
            'mailboxes' => $this->features->enabled('mailbox_enabled')
                ? $mailboxesQuery->get(['id', 'slug', 'domain_id'])
                : collect(),
        ];
    }
}
