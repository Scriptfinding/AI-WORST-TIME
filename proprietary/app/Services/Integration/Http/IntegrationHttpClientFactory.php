<?php

namespace App\Services\Integration\Http;

use App\Services\Security\PublicHttpTargetGuard;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

final class IntegrationHttpClientFactory
{
    public function __construct(
        private readonly PublicHttpTargetGuard $httpTargets,
    ) {}

    public function for(string $url): PendingRequest
    {
        return Http::withOptions($this->httpTargets->requestOptions(
            $url,
            (bool) config('puppetflow.integration_http_allow_private', false),
            (bool) config('puppetflow.integration_http_allow_http', false),
        ));
    }
}
