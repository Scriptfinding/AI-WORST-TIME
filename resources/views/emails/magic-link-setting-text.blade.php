@php($branding = app(\App\Contracts\BrandingProvider::class)->current())
Verify email delivery for {{ $branding['name'] }}

Your one-time code is: {{ $pin }}

Enter this code in the Server settings window to enable passwordless email sign-in. It expires in {{ $expiresInMinutes }} minutes.

If you did not request this change, ignore this email and review access to your administrator account.
