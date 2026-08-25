<?php

namespace App\Http\Controllers\Integration\Other\Vendor\Mailbox;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\ScopeEvaluator;
use App\Enums\Authorization\Ability;
use App\Enums\Integration\IntegrationCategoryEnum;
use App\Events\Integration\Other\Vendor\Mailbox\DomainDestroyRequested;
use App\Events\Integration\Other\Vendor\Mailbox\DomainStoreRequested;
use App\Events\Integration\Other\Vendor\Mailbox\DomainVerificationRequested;
use App\Http\Controllers\Controller;
use App\Models\Flow;
use App\Models\Integration;
use App\Models\Mailbox;
use App\Models\MailboxDomain;
use App\Models\MailboxWatcher;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Integration\Other\Vendor\Mailbox\DnsService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Validation\ValidationException;

class MailboxController extends Controller
{
    private const DOMAIN_NAME_RULE = 'regex:/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i';

    public function __construct(
        private DnsService $dnsService,
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly ScopeEvaluator $scopeEvaluator,
    ) {}

    public function createIntegration(Request $request): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $currentWorkspaceId = $this->workspaceIdFromSession();
        $workspaceId = $currentWorkspaceId;
        /** @var User $user */
        $user = $request->user();
        $context = $this->authorizationContexts->for($user, $workspaceId);
        abort_unless($this->scopeEvaluator->isAdministrator($context), 403);
        Gate::authorize(Ability::CREATE->value, Integration::class);

        /** @var array{name: string, domain: string, scope?: string, team_id?: string|null} $validated */
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'domain' => ['required', 'string', 'max:255', self::DOMAIN_NAME_RULE],
            'scope' => 'sometimes|in:'.implode(',', $this->features()->allowedScopes()),
            'team_id' => ['nullable', 'string'],
        ], [
            'domain.regex' => 'Enter a valid domain name.',
        ]);
        if (array_key_exists('team_id', $validated)) {
            $validated['team_id'] = $this->resolveWorkspaceTeamId($validated['team_id'], $workspaceId);
        }

        $scope = $validated['scope'] ?? 'owner';
        $teamId = $scope === 'team' ? ($validated['team_id'] ?? null) : null;
        abort_if($scope === 'team' && $teamId === null, 422, 'A team must be selected.');
        $domainName = strtolower($validated['domain']);

        $result = DB::transaction(function () use ($user, $validated, $workspaceId, $scope, $teamId, $domainName) {
            $integration = Integration::create([
                'workspace_id' => $workspaceId,
                'user_id' => $user->id,
                'category' => IntegrationCategoryEnum::OTHER,
                'provider' => 'mailbox',
                'name' => $validated['name'],
                'config' => [],
                'scope' => $scope,
                'team_id' => $teamId,
            ]);

            $event = new DomainStoreRequested(
                integration: $integration,
                workspaceId: $workspaceId,
                name: $domainName,
            );
            event($event);

            if ($event->error) {
                throw ValidationException::withMessages(['domain' => $event->error]);
            }

            return [
                'integration' => $integration,
                'domain' => $event->domain,
            ];
        });

        return response()->json($result, 201);
    }

    public function list(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::USE);
        $this->features()->abortIfStale($integration);

        $domains = MailboxDomain::where('integration_id', $integration->id)
            ->where('stale', false)
            ->withCount('mailboxes')
            ->orderBy('name')
            ->get();

        return response()->json(['domains' => $domains]);
    }

    public function store(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->features()->abortIfStale($integration);
        $this->abortIfReadonly($integration);

        $validated = $request->validate([
            'name' => ['required', 'string', 'max:255', self::DOMAIN_NAME_RULE],
        ], [
            'name.regex' => 'Enter a valid domain name.',
        ]);

        $event = new DomainStoreRequested(
            integration: $integration,
            workspaceId: $this->currentWorkspaceId(),
            name: strtolower($validated['name']),
        );
        event($event);

        if ($event->error) {
            return response()->json(['errors' => ['name' => $event->error]], 422);
        }

        return response()->json(['domain' => $event->domain], 201);
    }

    public function show(Request $request, Integration $integration, MailboxDomain $domain): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::USE);
        $this->features()->abortIfStale($integration);
        abort_unless($domain->integration_id === $integration->id, 404);
        $this->features()->abortIfStale($domain);

        $dnsRecords = $this->dnsService->generateRecords($domain);

        return response()->json([
            'domain' => $domain,
            'dnsRecords' => $dnsRecords,
        ]);
    }

    public function destroy(Request $request, Integration $integration, MailboxDomain $domain): JsonResponse
    {
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->abortIfReadonly($integration);
        abort_unless($domain->integration_id === $integration->id, 404);

        $event = new DomainDestroyRequested($integration, $domain);
        event($event);

        return response()->json(['success' => $event->success]);
    }

    public function verify(Request $request, Integration $integration, MailboxDomain $domain): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->features()->abortIfStale($integration);
        $this->abortIfReadonly($integration);
        abort_unless($domain->integration_id === $integration->id, 404);
        $this->features()->abortIfStale($domain);

        $event = new DomainVerificationRequested($integration, $domain);
        event($event);

        return response()->json(
            $event->result ?? ['mx' => ['valid' => false], 'txt' => ['valid' => false]],
        );
    }

    public function publicIp(): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');

        return response()->json(['ip' => $this->dnsService->getPublicIp()]);
    }

    public function usages(Request $request, Integration $integration): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->features()->abortIfStale($integration);

        $mailboxIds = $this->normalizeMailboxIds(
            Mailbox::whereIn(
                'domain_id',
                MailboxDomain::where('integration_id', $integration->id)->where('stale', false)->pluck('id')
            )->where('stale', false)->pluck('id'),
        );

        return response()->json($this->flowsUsingMailboxes($mailboxIds));
    }

    public function domainUsages(Request $request, Integration $integration, MailboxDomain $domain): JsonResponse
    {
        $this->features()->abortIfDisabled('mailbox_enabled');
        $this->authorizeIntegration($integration, Ability::UPDATE);
        $this->features()->abortIfStale($integration);
        abort_unless($domain->integration_id === $integration->id, 404);
        $this->features()->abortIfStale($domain);

        $mailboxIds = $this->normalizeMailboxIds(
            Mailbox::where('domain_id', $domain->id)
                ->where('stale', false)
                ->pluck('id'),
        );

        return response()->json($this->flowsUsingMailboxes($mailboxIds));
    }

    // Helpers

    /**
     * @param  Collection<int, string>  $mailboxIds
     * @return array{flows: list<array<string, mixed>>, watchers_count: int}
     */
    private function flowsUsingMailboxes(Collection $mailboxIds): array
    {
        if ($mailboxIds->isEmpty()) {
            return ['flows' => [], 'watchers_count' => 0];
        }

        $watchers = MailboxWatcher::whereIn('mailbox_id', $mailboxIds)->with('flow')->get();

        if ($watchers->isEmpty()) {
            return ['flows' => [], 'watchers_count' => 0];
        }

        $iconCols = ['icon_type', 'icon_value', 'icon_color', 'icon_upload_path', 'updated_at'];
        $flows = $watchers->groupBy('flow_id')->map(function ($group): array {
            $watcher = $group->first();
            abort_unless($watcher instanceof MailboxWatcher, 500, 'Invalid mailbox watcher group.');
            $flow = $watcher->flow;
            abort_unless($flow instanceof Flow, 500, 'Mailbox watcher flow not found.');
            /** @var list<string> $watcherNames */
            $watcherNames = array_values($group->pluck('name')->all());

            return [
                'flow_id' => $flow->id,
                'flow_name' => $flow->name,
                'icon_type' => $flow->icon_type,
                'icon_value' => $flow->icon_value,
                'icon_color' => $flow->icon_color,
                'icon_url' => $flow->icon_url,
                'watchers' => $watcherNames,
            ];
        })->values()->all();
        $flows = array_values($flows);

        return [
            'flows' => $flows,
            'watchers_count' => $watchers->count(),
        ];
    }

    /**
     * @param  Collection<int|string, mixed>  $ids
     * @return Collection<int, string>
     */
    private function normalizeMailboxIds(Collection $ids): Collection
    {
        $normalized = $ids->map(function (mixed $id): string {
            abort_unless(is_string($id) && $id !== '', 500, 'Invalid mailbox identifier.');

            return $id;
        })->values();

        /** @var Collection<int, string> $normalized */
        return $normalized;
    }

    private function authorizeIntegration(Integration $integration, Ability $ability): void
    {
        abort_unless($integration->workspace_id === $this->currentWorkspaceId(), 404);
        abort_unless($integration->category === IntegrationCategoryEnum::OTHER, 404);
        Gate::authorize($ability->value, $integration);
    }

    private function abortIfReadonly(Integration $integration): void
    {
        abort_if($integration->is_readonly, 403, 'This integration is managed by the instance and is read-only.');
    }

    private function features(): FeatureFlagService
    {
        return app(FeatureFlagService::class);
    }

    private function currentWorkspaceId(): string
    {
        $currentWorkspaceId = $this->workspaceIdFromSession();

        return $currentWorkspaceId;
    }
}
