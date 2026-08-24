<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}" data-timezone="{{ auth()->user()?->timezone ?? 'UTC' }}">
<head>
    @php($branding = app(\App\Contracts\BrandingProvider::class)->current())
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="csrf-token" content="{{ csrf_token() }}">
    <title>{{ $branding['name'] }}</title>
    <link id="app-favicon" rel="icon" href="{{ $branding['logo_url'] }}">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
    @viteReactRefresh
    @vite('resources/js/App/app.tsx')
    @inertiaHead
</head>
<body>
    @inertia
</body>
</html>
