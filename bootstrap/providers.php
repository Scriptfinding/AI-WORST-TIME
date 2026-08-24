<?php

$providers = [
    App\Providers\AppServiceProvider::class,
    App\Providers\AuthorizationServiceProvider::class,
    App\Providers\DatabaseServiceProvider::class,
    App\Providers\ProprietaryServiceProvider::class,
];

if (class_exists(Laravel\Telescope\TelescopeApplicationServiceProvider::class)) {
    $providers[] = App\Providers\TelescopeServiceProvider::class;
}

return $providers;
