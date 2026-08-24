import React from 'react';
import type { Workspace } from '@/Domains/Workspace/types';
import { colorFromString } from '@/Shared/Utils/string';
import * as S from './styled';

type IconData = Pick<Workspace, 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> & { name?: string };

interface WorkspaceIconProps {
    workspace: IconData;
    size?: number;
}

const FALLBACK_COLORS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#06b6d4', '#3b82f6',
];

export default function WorkspaceIcon({ workspace, size = 22 }: WorkspaceIconProps) {
    const { icon_type, icon_value, icon_color, icon_url } = workspace;
    const bg = icon_color || undefined;

    if (icon_type === 'upload' && icon_url) {
        const pad = bg ? Math.round(size * 0.12) : 0;
        return (
            <S.IconBase $size={size} $bg={bg} $pad={pad}>
                <S.UploadedImg src={icon_url} alt="" $size={size - pad * 2} />
            </S.IconBase>
        );
    }

    if (icon_type === 'emoji' && icon_value) {
        return (
            <S.IconBase $size={size} $bg={bg}>
                <S.EmojiContent $size={size}>{icon_value}</S.EmojiContent>
            </S.IconBase>
        );
    }

    if (icon_type === 'color' && icon_color) {
        const letter = (workspace.name || '?')[0].toUpperCase();
        return (
            <S.ColorBubble $size={size} $color={icon_color}>
                {letter}
            </S.ColorBubble>
        );
    }

    const letter = (workspace.name || '?')[0].toUpperCase();
    return (
        <S.ColorBubble $size={size} $color={colorFromString(workspace.name || '', FALLBACK_COLORS)}>
            {letter}
        </S.ColorBubble>
    );
}
