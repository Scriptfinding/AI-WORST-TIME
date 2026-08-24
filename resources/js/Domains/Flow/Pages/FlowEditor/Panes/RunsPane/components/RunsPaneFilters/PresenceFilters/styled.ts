import styled from 'styled-components';

type Tone = 'none' | 'neutral' | 'any';

export const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const Title = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
`;

export const Group = styled.div`
    display: inline-flex;
    align-items: center;
    width: fit-content;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const Button = styled.button<{ $active: boolean; $tone: Tone }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    min-height: 24px;
    padding: 0;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme, $active, $tone }) => {
        if (!$active) return 'transparent';
        if ($tone === 'none') return theme.colors.accent.error + '14';
        if ($tone === 'any') return theme.colors.accent.success + '14';
        return theme.colors.bg.hover;
    }};
    color: ${({ theme, $active, $tone }) => {
        if (!$active) return theme.colors.text.tertiary;
        if ($tone === 'none') return theme.colors.accent.error;
        if ($tone === 'any') return theme.colors.accent.success;
        return theme.colors.text.primary;
    }};
    font-size: 10px;
    font-weight: 600;
    transition: all ${({ theme }) => theme.transition.fast};

    &:last-child {
        border-right: 0;
    }

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;
