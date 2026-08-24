<?php

namespace App\Services\Integration\Other\Vendor\Mailbox;

use App\Enums\Integration\IntegrationCategoryEnum;
use App\Models\Integration;
use App\Models\MailboxDomain;
use App\Models\User;
use App\Models\Workspace;
use Illuminate\Support\Facades\DB;

class ManagedMailboxIntegrationService
{
    public function enabled(): bool
    {
        return (bool) config('puppetflow.managed_mailbox.enabled')
            && $this->domain() !== null;
    }

    public function syncForWorkspace(?Workspace $workspace, ?User $fallbackOwner = null): ?Integration
    {
        if (! $workspace || ! $this->enabled()) {
            return null;
        }

        $domain = $this->domain();
        if (! $domain) {
            return null;
        }

        $ownerId = $workspace->owner_id
            ?: $fallbackOwner?->id
            ?: $workspace->users()->value('users.id');

        if (! $ownerId) {
            return null;
        }

        return DB::transaction(function () use ($workspace, $ownerId, $domain) {
            $integration = Integration::firstOrNew([
                'workspace_id' => $workspace->id,
                'provider' => 'mailbox',
                'name' => $this->name(),
            ]);

            $config = $integration->exists ? ($integration->config ?? []) : [];

            $integration->fill([
                'user_id' => $ownerId,
                'category' => IntegrationCategoryEnum::OTHER,
                'provider' => 'mailbox',
                'name' => $this->name(),
                'config' => [
                    ...$config,
                    'managed_by_env' => true,
                    'readonly' => true,
                    'managed_domain' => $domain,
                ],
                'is_active' => true,
                'stale' => false,
                'scope' => 'workspace',
                'team_id' => null,
            ]);
            if (! $integration->exists || $integration->isDirty()) {
                $integration->save();
            }

            $mailboxDomain = MailboxDomain::where('workspace_id', $workspace->id)
                ->where('name', $domain)
                ->first()
                ?: MailboxDomain::where('integration_id', $integration->id)
                    ->where('stale', false)
                    ->first();

            if ($mailboxDomain) {
                $mailboxDomain->fill([
                    'workspace_id' => $workspace->id,
                    'integration_id' => $integration->id,
                    'name' => $domain,
                    'is_verified' => true,
                    'is_active' => true,
                    'stale' => false,
                ]);
                if ($mailboxDomain->isDirty()) {
                    $mailboxDomain->save();
                }
            } else {
                MailboxDomain::create([
                    'workspace_id' => $workspace->id,
                    'integration_id' => $integration->id,
                    'name' => $domain,
                    'is_verified' => true,
                    'is_active' => true,
                    'stale' => false,
                ]);
            }

            return $integration;
        });
    }

    private function name(): string
    {
        $configuredName = config('puppetflow.managed_mailbox.name', 'Shared Mailbox');
        $name = trim(is_string($configuredName) ? $configuredName : 'Shared Mailbox');

        return $name !== '' ? $name : 'Shared Mailbox';
    }

    private function domain(): ?string
    {
        $configuredDomain = config('puppetflow.managed_mailbox.domain', '');
        $domain = strtolower(trim(is_string($configuredDomain) ? $configuredDomain : ''));

        if ($domain === '') {
            return null;
        }

        return preg_match('/^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/', $domain)
            ? $domain
            : null;
    }
}
