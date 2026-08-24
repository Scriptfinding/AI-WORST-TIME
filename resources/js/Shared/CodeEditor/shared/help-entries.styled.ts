import styled from 'styled-components';

export const HelpEntryRow = styled.div`
    position: relative;
    margin-bottom: 6px;
`;

export const HelpEntry = styled.button<{ $active?: boolean; $color?: string; $hasEditAction?: boolean }>`
    width: 100%;
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: flex-start;
    gap: 9px;
    padding: 9px ${({ $hasEditAction }) => ($hasEditAction ? '42px' : '10px')} 9px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.border.focus) : 'transparent')};
    background: ${({ theme, $active }) => (
        $active
            ? theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.primary
            : 'transparent'
    )};
    text-align: left;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.border.focus) : theme.colors.border.default)};
        background: ${({ theme }) => (
            theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.primary
        )};
    }

    &:focus-visible {
        outline: 2px solid ${({ $color, theme }) => ($color || theme.colors.border.focus)}55;
        outline-offset: 1px;
    }

    ${({ $active, $color, theme }) => $active && `
        box-shadow: inset 3px 0 0 ${$color || theme.colors.border.focus};
    `}

    &:not(:hover):not(:focus-visible) {
        outline: none;
    }
`;

export const HelpEntryEditLink = styled.a`
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 1;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.65;
    transition:
        color ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast},
        opacity ${({ theme }) => theme.transition.fast};

    &:hover,
    &:focus-visible {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.primary};
        opacity: 1;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.border.focus}55;
        outline-offset: 1px;
    }
`;

export const HelpEntryIcon = styled.div<{ $color?: string }>`
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
`;

export const HelpEntryContent = styled.div`
    min-width: 0;
`;

export const HelpEntryTop = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
    margin-bottom: 5px;

    strong {
        font-size: 12px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    small {
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const HelpSignatureRow = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    margin-bottom: 2px;
`;

export const HelpSignature = styled.div`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    display: inline-block;
    margin-bottom: 2px;
    max-width: 100%;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const HelpDesc = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.45;
`;

export const HelpOptions = styled.div`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: 3px;
    padding-left: 8px;
    border-left: 2px solid ${({ theme }) => theme.colors.border.default};
    line-height: 1.6;
    word-break: break-all;
`;
