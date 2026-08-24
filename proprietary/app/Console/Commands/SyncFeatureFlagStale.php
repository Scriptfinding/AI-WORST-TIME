<?php

namespace App\Console\Commands;

use App\Services\FeatureFlags\FeatureFlagService;
use Illuminate\Console\Command;

class SyncFeatureFlagStale extends Command
{
    protected $signature = 'entitlements:sync-stale';
    protected $description = 'Synchronize stale resources with current entitlements.';

    public function handle(FeatureFlagService $featureFlags): int
    {
        $summary = $featureFlags->syncStaleStates();

        foreach ($summary as $resource => $state) {
            $status = $state['stale'] ? 'stale' : 'fresh';
            $enabled = $state['enabled'] ? 'enabled' : 'disabled';
            $this->line("{$resource}: {$status} ({$enabled}), updated {$state['updated']}");
        }

        return self::SUCCESS;
    }
}
