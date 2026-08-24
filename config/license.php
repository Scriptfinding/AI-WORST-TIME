<?php

return [
    'server_url' => env('PUPPETFLOW_LICENSE_SERVER_URL', 'https://lic.puppetflow.com'),
    'app_version' => env('APP_VERSION', trim((string) @file_get_contents(base_path('version.txt'))) ?: null),
    'managed_license' => trim((string) env('PUPPETFLOW_LICENSE_MANAGED', '')) !== '',
    'timeout' => 12,
];
