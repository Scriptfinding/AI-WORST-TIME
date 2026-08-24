<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Cross-Origin Resource Sharing (CORS) Configuration
    |--------------------------------------------------------------------------
    |
    | Here you may configure your settings for cross-origin resource sharing
    | or "CORS". This determines what cross-origin operations may execute
    | in web browsers. You are free to adjust these settings as needed.
    |
    | To learn more: https://developer.mozilla.org/en-US/docs/Web/HTTP/CORS
    |
    */

    'paths' => ['api/*', 'sanctum/csrf-cookie'],

    'allowed_methods' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_METHODS', 'GET,HEAD,POST,PUT,PATCH,DELETE,OPTIONS')),
    ))),

    'allowed_origins' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env('CORS_ALLOWED_ORIGINS', '')),
    ))),

    'allowed_origins_patterns' => array_filter(
        array_map('trim', explode(',', (string) env('CORS_ALLOWED_ORIGINS_PATTERNS', '~^https://([a-zA-Z0-9-]+\.)*puppetflow\.com$~,~^https?://localhost(:[0-9]+)?$~,~^https?://127\.0\.0\.1(:[0-9]+)?$~,~^https?://\[::1\](:[0-9]+)?$~')))
    ),

    'allowed_headers' => array_values(array_filter(array_map(
        'trim',
        explode(',', (string) env(
            'CORS_ALLOWED_HEADERS',
            'Accept,Authorization,Content-Type,Origin,X-CSRF-TOKEN,X-Requested-With',
        )),
    ))),

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => false,

];
