<?php

namespace App\Services\Puppeteer;

use App\Authorization\AuthorizationContext;
use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Models\Flow;
use App\Models\MailboxWatcher;
use App\Models\NotificationChannel;
use App\Models\Snippet;
use App\Models\User;
use App\Services\FeatureFlags\FeatureFlagService;

final class PuppeteerRuntimeExporter
{
    /** @var array<string, AuthorizationContext|null> */
    private array $runtimeContexts = [];

    public function __construct(
        private readonly AuthorizationContextFactory $authorizationContexts,
        private readonly SharedResourceVisibility $sharedVisibility,
        private readonly FeatureFlagService $featureFlags,
    ) {}

    /** @param list<string> $secretValues */
    public function channels(Flow $flow, ?string $userId = null, array &$secretValues = [], bool $allAccess = false): string
    {
        if (! $allAccess && ! $this->featureFlags->enabled('messenger_enabled')) {
            return '[]';
        }

        $context = $allAccess ? null : $this->runtimeContext($flow, $userId);
        if (! $allAccess && ! $context) {
            return '[]';
        }

        $query = NotificationChannel::query()->where('is_active', true)->where('stale', false);
        if ($allAccess) {
            $query->where('workspace_id', $flow->workspace_id);
        } else {
            $this->sharedVisibility->applyUse($query, $context);
        }

        $actor = $context?->user;
        $channels = $query
            ->with('messengerIntegration')
            ->orderByRaw("CASE WHEN scope = 'user' THEN 0 ELSE 1 END")
            ->get(['id', 'name', 'provider', 'config', 'scope', 'messenger_integration_id'])
            ->map(function (NotificationChannel $channel) use ($actor, $flow, $allAccess) {
                try {
                    if ($allAccess) {
                        $token = $channel->getToken();
                    } elseif ($actor instanceof User) {
                        $token = $channel->getRuntimeToken($actor, $flow->workspace_id);
                    } else {
                        return null;
                    }

                    return [
                        'id' => $channel->id,
                        'name' => $channel->name,
                        'provider' => $channel->provider,
                        'token' => $token,
                        'chat_id' => $channel->getChatId(),
                    ];
                } catch (\Throwable) {
                    return null;
                }
            })
            ->filter()
            ->values()
            ->toArray();

        /** @var list<array{id: string, name: string, provider: string, token: string|null, chat_id: string|null}> $channels */
        foreach ($channels as $channel) {
            $token = $channel['token'] ?? null;
            if (is_string($token) && $token !== '') {
                $secretValues[] = $token;
            }
        }
        $secretValues = array_values(array_unique($secretValues));

        return json_encode($channels, JSON_PRETTY_PRINT) ?: '[]';
    }

    public function watchers(Flow $flow, ?string $userId = null, bool $allAccess = false): string
    {
        if (! $allAccess && ! $this->featureFlags->enabled('mailbox_enabled')) {
            return json_encode([], JSON_PRETTY_PRINT) ?: '[]';
        }

        $context = $allAccess ? null : $this->runtimeContext($flow, $userId);
        if (! $allAccess && ! $context) {
            return json_encode([], JSON_PRETTY_PRINT) ?: '[]';
        }

        $query = MailboxWatcher::query()
            ->join('flows', 'flows.id', '=', 'mailbox_watchers.flow_id')
            ->where('mailbox_watchers.flow_id', $flow->id)
            ->where('mailbox_watchers.is_active', true)
            ->where('mailbox_watchers.stale', false)
            ->where(function ($query) use ($flow) {
                $query->where('mailbox_watchers.scope', '!=', 'team')
                    ->orWhereHas('team', fn ($team) => $team->where('workspace_id', $flow->workspace_id));
            })
            ->whereHas('mailbox', function ($query) use ($context, $allAccess) {
                $query->where('stale', false)
                    ->whereHas('domain', fn ($domain) => $domain->where('stale', false));
                if (! $allAccess) {
                    $this->sharedVisibility->applyUse($query, $context);
                }
            });

        if (! $allAccess) {
            $this->sharedVisibility->applyUse(
                $query,
                $context,
                workspaceColumn: 'flows.workspace_id',
                ownerColumn: 'mailbox_watchers.user_id',
                scopeColumn: 'mailbox_watchers.scope',
                teamColumn: 'mailbox_watchers.team_id',
            );
        }

        $watchers = $query
            ->get(['mailbox_watchers.id', 'mailbox_watchers.name', 'mailbox_watchers.timeout'])
            ->mapWithKeys(fn ($watcher) => [$watcher->id => [
                'name' => $watcher->name,
                'timeout' => $watcher->timeout,
            ]])
            ->toArray();

        return json_encode($watchers, JSON_PRETTY_PRINT) ?: '[]';
    }

    public function snippets(Flow $flow, ?string $userId = null, bool $allAccess = false): string
    {
        if (! $allAccess && ! $this->featureFlags->enabled('snippets_enabled')) {
            return '';
        }

        $context = $allAccess ? null : $this->runtimeContext($flow, $userId);
        if (! $allAccess && ! $context) {
            return '';
        }

        $query = Snippet::query()->where('is_active', true)->where('stale', false);
        if ($allAccess) {
            $query->where('workspace_id', $flow->workspace_id);
        } else {
            $this->sharedVisibility->applyUse($query, $context);
        }

        $lines = [];
        foreach ($query->get(['id', 'args', 'code']) as $snippet) {
            $ref = preg_replace('/[^a-z0-9_]/i', '', $snippet->id);
            $params = $snippet->args ?? '';
            $body = $snippet->code ?? '';
            $lines[] = "const \$\${$ref} = async function({$params}) {\n{$body}\n};";
        }

        return implode("\n\n", $lines);
    }

    private function runtimeContext(Flow $flow, ?string $userId): ?AuthorizationContext
    {
        if ($userId === null) {
            return null;
        }

        $cacheKey = $userId.':'.$flow->workspace_id;
        if (array_key_exists($cacheKey, $this->runtimeContexts)) {
            return $this->runtimeContexts[$cacheKey];
        }

        $user = User::find($userId);

        return $this->runtimeContexts[$cacheKey] = $user
            ? $this->authorizationContexts->for($user, $flow->workspace_id)
            : null;
    }
}
