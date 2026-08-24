@php($branding = app(\App\Contracts\BrandingProvider::class)->current())
<x-mail.layout
    title="Workspace invitation"
    preheader="{{ $invitation->inviter->name }} invited you to join {{ $invitation->workspace->name }}."
    footer="This invitation expires in 7 days. If you did not expect it, you can safely ignore this email."
    :branding="$branding"
>
    <h1 style="margin:0 0 12px;color:#17211d;font-size:27px;line-height:1.2;letter-spacing:-0.035em;">
        Join {{ $invitation->workspace->name }}
    </h1>
    <p style="margin:0 0 26px;color:#52615b;font-size:15px;line-height:1.65;">
        <strong style="color:#17211d;">{{ $invitation->inviter->name }}</strong> invited you to collaborate
        in this workspace on {{ $branding['name'] }}.
    </p>
    <table role="presentation" cellspacing="0" cellpadding="0" align="center" style="margin:0 auto 24px;">
        <tr>
            <td style="border-radius:10px;background:{{ $branding['accent_color'] }};">
                <a href="{{ url('/register?invitation='.$invitation->token) }}" style="display:inline-block;padding:13px 21px;color:#ffffff;font-size:14px;font-weight:750;text-decoration:none;">
                    Accept invitation
                </a>
            </td>
        </tr>
    </table>
    <p style="margin:0;color:#6c7a74;font-size:12px;line-height:1.6;">
        This link is intended only for {{ $invitation->email }}.
    </p>
</x-mail.layout>
