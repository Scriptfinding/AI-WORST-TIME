import React from 'react';
import { useForm } from '@inertiajs/react';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import type { Workspace } from '@/Domains/Workspace/types';
import * as S from './BrowserSection.styled';

interface Props {
    workspace: Workspace;
    readOnly?: boolean;
}

export default function BrowserSection({ workspace, readOnly }: Props) {
    const form = useForm({
        viewport_width: workspace.viewport_width ?? 1280,
        viewport_height: workspace.viewport_height ?? 720,
        keyboard_speed: workspace.keyboard_speed ?? 100,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (readOnly) return;
        form.put('/workspace');
    };

    return (
        <S.Form onSubmit={handleSubmit}>
            <S.FormRow>
                <Input
                    label="Default viewport width"
                    type="number"
                    value={String(form.data.viewport_width)}
                    onChange={e => form.setData('viewport_width', Number(e.target.value))}
                    error={form.errors.viewport_width}
                    disabled={readOnly}
                />
                <span style={{ marginTop: 18, color: '#888' }}>x</span>
                <Input
                    label="Default viewport height"
                    type="number"
                    value={String(form.data.viewport_height)}
                    onChange={e => form.setData('viewport_height', Number(e.target.value))}
                    error={form.errors.viewport_height}
                    disabled={readOnly}
                />
            </S.FormRow>
            <S.FieldHint>
                Default browser viewport size for all flows (320-3840 x 200-2160). Can be overridden per flow. Larger viewports increase disk usage when video recording is enabled.
            </S.FieldHint>
            <Input
                label="Default keyboard speed"
                type="number"
                value={String(form.data.keyboard_speed)}
                onChange={e => form.setData('keyboard_speed', Number(e.target.value))}
                error={form.errors.keyboard_speed}
                disabled={readOnly}
            />
            <S.FieldHint>
                Default delay between keystrokes in milliseconds (0-10000). Can be overridden per flow or run.
            </S.FieldHint>
            {!readOnly && (
                <S.FormActions>
                    <Button type="submit" size="sm" disabled={form.processing}>
                        Save
                    </Button>
                </S.FormActions>
            )}
        </S.Form>
    );
}
