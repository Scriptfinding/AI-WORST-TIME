@php($branding = app(\App\Contracts\BrandingProvider::class)->current())
Continue to {{ $branding['name'] }}

Your one-time code is: {{ $pin }}

Or sign in using this link:
{{ $magicUrl }}

This code and link expire in {{ $expiresInMinutes }} minutes. If you did not request this email, you can ignore it.
