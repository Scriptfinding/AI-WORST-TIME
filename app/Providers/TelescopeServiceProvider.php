<?php

namespace App\Providers;

use App\Models\User;
use Illuminate\Support\Facades\Gate;
use Laravel\Telescope\IncomingEntry;
use Laravel\Telescope\Telescope;
use Laravel\Telescope\TelescopeApplicationServiceProvider;

class TelescopeServiceProvider extends TelescopeApplicationServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->hideSensitiveRequestDetails();

        $isLocal = $this->app->environment('local');
        $recordAll = (bool) config('telescope.record_all', false);

        Telescope::filter(function (IncomingEntry $entry) use ($isLocal, $recordAll) {
            return $isLocal ||
                   $recordAll ||
                   $entry->isReportableException() ||
                   $entry->isFailedRequest() ||
                   $entry->isFailedJob() ||
                   $entry->isScheduledTask() ||
                   $entry->hasMonitoredTag();
        });
    }

    /**
     * Prevent sensitive request details from being logged by Telescope.
     */
    protected function hideSensitiveRequestDetails(): void
    {
        Telescope::hideRequestParameters([
            '_token',
            'api_key',
            'client_secret',
            'code',
            'license_file',
            'password',
            'password_confirmation',
            'recovery_code',
            'secret',
            'token',
        ]);

        Telescope::hideRequestHeaders([
            'authorization',
            'cookie',
            'php-auth-pw',
            'x-csrf-token',
            'x-puppetflow-key',
            'x-xsrf-token',
        ]);
    }

    /**
     * Register the Telescope gate.
     *
     * This gate determines who can access Telescope in non-local environments.
     */
    protected function gate(): void
    {
        Gate::define('viewTelescope', function (User $user) {
            return (bool) config('telescope.enabled') && $user->isAdmin();
        });
    }
}
