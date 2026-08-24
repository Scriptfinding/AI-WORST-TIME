import React, { useEffect, useRef, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import type { Branding } from '@/App/types';
import * as Base from '@/Domains/Admin/Pages/Server/shared.styled';
import * as S from './brandingStyled.pp';

const PRESET_COLORS = [
    '#48C591', '#6366F1', '#8B5CF6', '#A855F7',
    '#EC4899', '#F43F5E', '#EF4444', '#F97316',
    '#EAB308', '#22C55E', '#14B8A6', '#06B6D4',
    '#3B82F6', '#2563EB', '#0EA5E9', '#64748B',
];

interface Props {
    branding: Branding;
}

export default function BrandingSection({ branding }: Props) {
    const [name, setName] = useState(branding.name);
    const [accentColor, setAccentColor] = useState(branding.accent_color);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const [resetting, setResetting] = useState(false);
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        setName(branding.name);
        setAccentColor(branding.accent_color);
    }, [branding.name, branding.accent_color]);

    const save = (event: React.FormEvent) => {
        event.preventDefault();
        router.put('/admin/server/branding', {
            name: name.trim(),
            accent_color: accentColor,
        }, {
            preserveScroll: true,
            onStart: () => setSaving(true),
            onFinish: () => setSaving(false),
        });
    };

    const uploadLogo = (event: React.ChangeEvent<HTMLInputElement>) => {
        const logo = event.target.files?.[0];
        if (!logo) return;

        router.post('/admin/server/branding/logo', { logo } as Record<string, File>, {
            forceFormData: true,
            preserveScroll: true,
            onStart: () => setUploading(true),
            onFinish: () => {
                setUploading(false);
                event.target.value = '';
            },
        });
    };

    const removeLogo = () => {
        router.delete('/admin/server/branding/logo', { preserveScroll: true });
    };

    const reset = () => {
        router.delete('/admin/server/branding', {
            preserveScroll: true,
            onStart: () => setResetting(true),
            onFinish: () => setResetting(false),
        });
    };

    return (
        <Base.Card>
            <Base.CardTitle>
                <Icon icon="lucide:palette" width={15} height={15} />
                Branding
            </Base.CardTitle>

            <S.Preview>
                <S.LogoPreview src={branding.logo_url} alt="" />
                <S.PreviewCopy>
                    <S.PreviewName>{name || branding.name}</S.PreviewName>
                    <S.PreviewHint>Used in the sidebar, authentication pages and browser titles.</S.PreviewHint>
                </S.PreviewCopy>
            </S.Preview>

            <S.LogoActions>
                <input
                    ref={fileRef}
                    type="file"
                    accept="image/png,image/jpeg,image/webp"
                    onChange={uploadLogo}
                    hidden
                />
                <Button type="button" variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
                    <Icon icon="lucide:upload" width={13} />
                    Change logo
                </Button>
                {branding.customized && branding.logo_url !== '/img/logo/logo.png' && (
                    <Button type="button" variant="ghost" size="sm" onClick={removeLogo}>
                        Remove logo
                    </Button>
                )}
            </S.LogoActions>
            <S.HelpText>PNG, JPG or WebP. Maximum 2 MB.</S.HelpText>

            <S.Form onSubmit={save}>
                <S.Field>
                    <S.Label htmlFor="branding-name">Product name</S.Label>
                    <S.Input
                        id="branding-name"
                        value={name}
                        maxLength={80}
                        required
                        onChange={(event) => setName(event.target.value)}
                    />
                </S.Field>

                <S.Field>
                    <S.Label>Accent color</S.Label>
                    <S.Swatches>
                        {PRESET_COLORS.map((color) => (
                            <S.Swatch
                                key={color}
                                type="button"
                                $color={color}
                                $active={accentColor.toUpperCase() === color}
                                onClick={() => setAccentColor(color)}
                                aria-label={`Use ${color}`}
                            />
                        ))}
                        <S.CustomColor $active={!PRESET_COLORS.includes(accentColor.toUpperCase())} title="Custom color">
                            <Icon icon="lucide:pipette" width={14} />
                            <input
                                type="color"
                                value={accentColor}
                                onChange={(event) => setAccentColor(event.target.value.toUpperCase())}
                            />
                        </S.CustomColor>
                    </S.Swatches>
                </S.Field>

                <S.Actions>
                    <Button type="button" variant="ghost" size="sm" loading={resetting} onClick={reset}>
                        Reset defaults
                    </Button>
                    <Button type="submit" size="sm" loading={saving} disabled={!name.trim()}>
                        Save branding
                    </Button>
                </S.Actions>
            </S.Form>
        </Base.Card>
    );
}
