import styled from 'styled-components';

export const EditCodeBtn = styled.button`
    position: absolute;
    bottom: -14px;
    right: 16px;
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    transition: color ${({ theme }) => theme.transition.fast}, border-color ${({ theme }) => theme.transition.fast};
    cursor: pointer;
    z-index: 2;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        border-color: ${({ theme }) => theme.colors.accent.primary}60;
    }

    svg { width: 12px; height: 12px; }
`;

export const CoverZone = styled.div`
    position: relative;
    flex-shrink: 0;
`;

export const Cover = styled.div<{ $color?: string | null }>`
    position: relative;
    height: 120px;
    background: ${({ $color }) => {
        const c = $color && $color !== 'transparent' ? $color : '#10b981';
        return `linear-gradient(135deg, ${c}cc 0%, ${c}66 50%, ${c}33 100%)`;
    }};
`;

export const CoverActions = styled.div`
    position: absolute;
    top: 10px;
    right: 12px;
    display: flex;
    gap: 6px;
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transition.fast};

    ${Cover}:hover & {
        opacity: 1;
    }
`;

export const CoverButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 5px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 11px;
    font-weight: 500;
    color: #fff;
    background: rgba(0, 0, 0, 0.35);
    backdrop-filter: blur(6px);
    transition: background ${({ theme }) => theme.transition.fast};
    cursor: pointer;

    &:hover {
        background: rgba(0, 0, 0, 0.55);
    }

    svg { width: 13px; height: 13px; }
`;
