@props([
    'title',
    'preheader' => '',
    'footer' => null,
    'branding' => null,
])
@php
    $branding = $branding ?? app(\App\Contracts\BrandingProvider::class)->current();
    $background = '#f4f7f6';
    $text = '#17211d';
    $cardBackground = '#ffffff';
    $cardBorder = '#dce5e1';
    $footerColor = '#6c7a74';
    $logoUrl = url($branding['logo_url']);
@endphp
<!doctype html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>{{ $title }}</title>
</head>
<body style="margin:0;background:{{ $background }};color:{{ $text }};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
    <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{{ $preheader }}</div>
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background:{{ $background }};">
        <tr>
            <td align="center" style="padding:44px 18px;">
                <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:560px;">
                    <tr>
                        <td align="center" style="padding:0 0 22px;color:{{ $text }};font-size:20px;font-weight:750;letter-spacing:-0.02em;text-align:center;">
                            <img src="{{ $logoUrl }}" alt="" style="display:inline-block;max-width:120px;max-height:32px;width:auto;height:auto;margin-right:9px;vertical-align:middle;">
                            <span style="display:inline-block;vertical-align:middle;">{{ $branding['name'] }}</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:38px;border:1px solid {{ $cardBorder }};border-radius:18px;background:{{ $cardBackground }};">
                            {{ $slot }}
                        </td>
                    </tr>
                    <tr>
                        <td style="padding:20px 8px 0;color:{{ $footerColor }};font-size:12px;line-height:1.6;text-align:center;">
                            {{ $footer ?? 'This message was sent by '.$branding['name'].'.' }}
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>
