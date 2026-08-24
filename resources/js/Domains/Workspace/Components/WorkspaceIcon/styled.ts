import styled from 'styled-components';

export const IconBase = styled.span<{ $size: number; $bg?: string; $pad?: number }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    padding: ${p => p.$pad ?? 0}px;
    border-radius: ${({ theme }) => theme.radius.sm};
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

export const ColorBubble = styled.span<{ $size: number; $color: string }>`
    width: ${p => p.$size}px;
    height: ${p => p.$size}px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${p => p.$color};
    color: #fff;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: ${p => Math.round(p.$size * 0.5)}px;
    font-weight: 600;
    flex-shrink: 0;
    overflow: hidden;
`;
