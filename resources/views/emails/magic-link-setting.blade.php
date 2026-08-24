@php($branding = app(\App\Contracts\BrandingProvider::class)->current())
<x-mail.layout
    title="Confirm passwordless sign-in for {{ $branding['name'] }}"
    preheader="Use {{ $pin }} to verify email delivery before enabling passwordless sign-in."
    footer="This message was sent because an administrator requested a server authentication change."
    :branding="$branding"
>
    <h1 style="margin:0 0 12px;color:#17211d;font-size:27px;line-height:1.2;letter-spacing:-0.035em;">
        Verify email delivery
    </h1>
    <p style="margin:0 0 26px;color:#52615b;font-size:15px;line-height:1.65;">
        Enter this one-time code in the Server settings window to enable passwordless email sign-in. It expires in {{ $expiresInMinutes }} minutes.
    </p>
    <div style="margin:0 0 26px;padding:18px 20px;border:1px solid #dce5e1;border-radius:12px;background:#f6f8f7;color:#17211d;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:0.22em;text-align:center;">
        {{ $pin }}
    </div>
    <p style="margin:0;color:#6c7a74;font-size:12px;line-height:1.6;">
        If you did not request this change, ignore this email and review access to your administrator account.
    </p>
</x-mail.layout>
