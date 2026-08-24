<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'key' => env('POSTMARK_API_KEY'),
    ],

    'resend' => [
        'key' => env('RESEND_API_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'social_auth' => [
        'enabled' => env('SOCIALITE_ENABLED', false),
    ],

    'google' => [
        'enabled' => env('SOCIALITE_GOOGLE_ENABLED', true),
        'client_id' => env('SOCIALITE_GOOGLE_CLIENT_ID'),
        'client_secret' => env('SOCIALITE_GOOGLE_CLIENT_SECRET'),
        'redirect' => env('SOCIALITE_GOOGLE_REDIRECT_URI'),
    ],

    'github' => [
        'enabled' => env('SOCIALITE_GITHUB_ENABLED', true),
        'client_id' => env('SOCIALITE_GITHUB_CLIENT_ID'),
        'client_secret' => env('SOCIALITE_GITHUB_CLIENT_SECRET'),
        'redirect' => env('SOCIALITE_GITHUB_REDIRECT_URI'),
        'scopes' => ['read:user', 'user:email'],
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'pinokio' => [
        'enabled' => env('PINOKIO_ENABLED', true),
        'host' => env('PINOKIO_HOST', 'localhost'),
        'port' => env('PINOKIO_PORT', '3000'),
        'token' => env('PINOKIO_TOKEN', ''),
        'secure' => env('PINOKIO_SECURE', false),
    ],

    'browser' => [
        'disable_web_security' => env('BROWSER_DISABLE_WEB_SECURITY', false),
    ],

    'browser_stream' => [
        'internal_url' => env('BROWSER_STREAM_INTERNAL_URL', 'http://localhost:6080'),
        'internal_port' => env('BROWSER_STREAM_INTERNAL_PORT', '6080'),
        'public_url' => env('BROWSER_STREAM_PUBLIC_URL', 'http://localhost:6080'),
        'secret' => env('BROWSER_STREAM_SECRET'),
        'token_ttl' => env('BROWSER_STREAM_TOKEN_TTL', 60),
        'max_token_ttl' => env('BROWSER_STREAM_MAX_TOKEN_TTL', 300),
        'producer_token_ttl' => env('BROWSER_STREAM_PRODUCER_TOKEN_TTL', 300),
        'producer_max_token_ttl' => env('BROWSER_STREAM_PRODUCER_MAX_TOKEN_TTL', 10000029),
    ],

];
