<?php

namespace App\Providers;

use App\Contracts\BrandingProvider;
use App\Events\RegistrationRequestApproved;
use App\Listeners\LinkApprovedSsoRegistration;
use App\Services\FeatureFlags\FeatureFlagService;
use App\Services\Licensing\LicenseInstanceId;
use App\Services\Licensing\LicenseManager;
use App\Services\Whitelabel\WhitelabelBrandingProvider;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\ServiceProvider;

class ProprietaryServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(BrandingProvider::class, WhitelabelBrandingProvider::class);
        $this->app->scoped(FeatureFlagService::class);
        $this->app->scoped(LicenseInstanceId::class);
        $this->app->scoped(LicenseManager::class);
    }

    public function boot(): void
    {
        Event::listen(RegistrationRequestApproved::class, LinkApprovedSsoRegistration::class);
        $this->loadMigrationsFrom(base_path('proprietary/database/migrations'));
        $this->loadRoutesFrom(base_path('proprietary/routes/web.php'));
    }
}
