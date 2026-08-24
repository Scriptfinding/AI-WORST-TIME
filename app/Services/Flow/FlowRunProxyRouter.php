<?php

namespace App\Services\Flow;

use App\Authorization\AuthorizationContextFactory;
use App\Authorization\Visibility\SharedResourceVisibility;
use App\Models\Flow;
use App\Models\User;
use App\Models\WorkspaceProxy;
use Illuminate\Support\Facades\Cache;
use Illuminate\Validation\ValidationException;

final class FlowRunProxyRouter
{
    public function __construct(
        private readonly AuthorizationContextFactory $contexts,
        private readonly SharedResourceVisibility $visibility,
    ) {}

    /** @return array<string, mixed> */
    public function resolve(Flow $flow, User $user): array
    {
        $mode = $flow->proxy_mode ?: 'none';
        if ($mode === 'none') {
            return ['mode' => 'none'];
        }

        $context = $this->contexts->for($user, $flow->workspace_id);

        if ($mode === 'specific') {
            $query = WorkspaceProxy::query()->whereKey($flow->workspace_proxy_id);
            $this->visibility->applyUse($query, $context, scopeColumn: 'visibility');
            $proxy = $query->first();
            if (! $proxy instanceof WorkspaceProxy) {
                throw ValidationException::withMessages([
                    'proxy' => 'The proxy assigned to this flow is not available to the user running it.',
                ]);
            }

            return $this->snapshot($proxy);
        }

        if ($mode !== 'auto') {
            throw ValidationException::withMessages([
                'proxy' => 'The flow has an invalid proxy mode.',
            ]);
        }

        $query = WorkspaceProxy::query()->orderBy('id');
        $this->visibility->applyUse($query, $context, scopeColumn: 'visibility');
        $proxies = $query->get();
        if ($proxies->isEmpty()) {
            throw ValidationException::withMessages([
                'proxy' => 'Auto proxy routing requires at least one proxy available to the user running this flow.',
            ]);
        }
        $poolKey = hash('sha256', $proxies->pluck('id')->implode(','));

        $proxy = Cache::lock("puppetflow:proxies:{$flow->workspace_id}:{$poolKey}:routing", 10)->block(
            10,
            function () use ($flow, $proxies, $poolKey): WorkspaceProxy {
                $cursorKey = "puppetflow:proxies:{$flow->workspace_id}:{$poolKey}:cursor";
                $rawCursor = Cache::get($cursorKey, 0);
                $cursor = is_numeric($rawCursor) ? max(0, (int) $rawCursor) : 0;
                $proxy = $proxies->get($cursor % $proxies->count());
                if (! $proxy instanceof WorkspaceProxy) {
                    throw new \LogicException('Round-robin proxy selection returned an invalid result.');
                }
                Cache::forever($cursorKey, ($cursor + 1) % $proxies->count());

                return $proxy;
            },
        );

        if (! $proxy instanceof WorkspaceProxy) {
            throw new \LogicException('Proxy routing lock returned an invalid result.');
        }

        return $this->snapshot($proxy);
    }

    /** @return array<string, mixed> */
    private function snapshot(WorkspaceProxy $proxy): array
    {
        return [
            'mode' => 'proxy',
            'id' => $proxy->id,
            'label' => $proxy->label,
            'server' => $proxy->server(),
            'username' => $proxy->username,
            'password' => $proxy->password,
        ];
    }
}
