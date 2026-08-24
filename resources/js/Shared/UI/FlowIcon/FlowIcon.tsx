import type { Flow } from '@/Domains/Flow/types';
import { colorFromString, textColorForBg } from '@/Shared/Utils/string';
import * as S from './styled';
import type { Radius } from './styled';

type IconData = Pick<Flow, 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url'> & { name?: string };

interface FlowIconProps {
    flow: IconData;
    size?: number;
    radius?: Radius;
}

const FALLBACK_COLORS = [
    '#10b981', '#22c55e', '#14b8a6', '#06b6d4',
    '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899',
    '#f43f5e', '#f97316',
];

export default function FlowIcon({ flow, size = 22, radius = 'sm' }: FlowIconProps) {
    const { icon_type, icon_value, icon_color, icon_url } = flow;
    const bg = icon_color || undefined;

    if (icon_type === 'upload' && icon_url) {
        const pad = bg ? Math.round(size * 0.12) : 0;
        return (
            <S.IconBase $size={size} $bg={bg} $pad={pad} $radius={radius}>
                <S.UploadedImg src={icon_url} alt="" $size={size - pad * 2} />
            </S.IconBase>
        );
    }

    if (icon_type === 'emoji' && icon_value) {
        return (
            <S.IconBase $size={size} $bg={bg} $radius={radius}>
                <S.EmojiContent $size={size}>{icon_value}</S.EmojiContent>
            </S.IconBase>
        );
    }

    if (icon_type === 'color' && icon_color && icon_color !== 'transparent') {
        const letter = (flow.name || '?')[0].toUpperCase();
        return (
            <S.ColorBubble $size={size} $color={icon_color} $textColor={textColorForBg(icon_color)} $radius={radius}>
                {letter}
            </S.ColorBubble>
        );
    }

    const fallback = colorFromString(flow.name || '', FALLBACK_COLORS);
    const letter = (flow.name || '?')[0].toUpperCase();
    return (
        <S.ColorBubble $size={size} $color={fallback} $textColor={textColorForBg(fallback)} $radius={radius}>
            {letter}
        </S.ColorBubble>
    );
}
