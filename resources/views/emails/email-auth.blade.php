@php($branding = app(\App\Contracts\BrandingProvider::class)->current())
<x-mail.layout
    title="Pin-Code {{ $pin }} from {{ $branding['name'] }}"
    preheader="Use {{ $pin }} to continue to {{ $branding['name'] }}."
    footer="This message was sent because someone requested access to {{ $branding['name'] }} using this email."
    :branding="$branding"
>
    <h1 style="margin:0 0 12px;color:#17211d;font-size:27px;line-height:1.2;letter-spacing:-0.035em;">
        Continue to {{ $branding['name'] }}
    </h1>
    <p style="margin:0 0 26px;color:#52615b;font-size:15px;line-height:1.65;">
        Enter this one-time code in the window where you started. It expires in {{ $expiresInMinutes }} minutes.
    </p>
    <div style="margin:0 0 26px;padding:18px 20px;border:1px solid #dce5e1;border-radius:12px;background:#f6f8f7;color:#17211d;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:34px;font-weight:800;letter-spacing:0.22em;text-align:center;">
        {{ $pin }}
    </div>
    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
        <tr>
            <td style="border-radius:10px;background:{{ $branding['accent_color'] }};">
                <a href="{{ $magicUrl }}" style="display:inline-block;padding:13px 21px;color:#ffffff;font-size:14px;font-weight:750;text-decoration:none;">
                    Continue to sign in
                </a>
            </td>
        </tr>
    </table>
    <p style="margin:0;color:#6c7a74;font-size:12px;line-height:1.6;">
        If you did not request this email, you can safely ignore it. Never share this code with anyone.
    </p>
</x-mail.layout>
