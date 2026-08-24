import styled from 'styled-components';

export type Radius = 'xxs' | 'xs' | 'sm' | 'md' | 'lg' | 'xl' | 'full';

export const IconBase = styled.span<{ $size: number; $bg?: string; $pad?: number; $radius?: Radius }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    padding: ${p => p.$pad ?? 0}px;
    border-radius: ${({ theme, $radius }) => theme.radius[$radius || 'sm']};
    background: ${p => p.$bg || 'transparent'};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    overflow: hidden;
`;

export const UploadedImg = styled.img<{ $size: number }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    object-fit: contain;
    display: block;
`;

export const EmojiContent = styled.span<{ $size: number }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    font-size: ${p => Math.round(p.$size * 0.65)}px;
    line-height: 1;
    overflow: hidden;
`;

export const ColorBubble = styled.span<{ $size: number; $color: string; $textColor: string; $radius?: Radius }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    border-radius: ${({ theme, $radius }) => theme.radius[$radius || 'sm']};
    background: ${p => p.$color};
    color: ${p => p.$textColor};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: ${p => Math.round(p.$size * 0.5)}px;
    font-weight: 600;
    flex-shrink: 0;
    overflow: hidden;
`;
