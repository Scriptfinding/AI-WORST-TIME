import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Trigger = styled.button<{ $error: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 10px;
    border: 1px solid ${({ theme, $error }) => (
        $error
            ? theme.colors.accent.error
            : theme.colors.border.default
    )};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;

    &:disabled {
        cursor: default;
        opacity: 0.7;
    }
`;

export const Menu = styled.div`
    position: fixed;
    z-index: 2000;
    min-width: 210px;
    padding: 5px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 9px;
    border: 0;
    border-radius: 6px;
    background: transparent;
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    font-size: 12px;
    text-align: left;
    cursor: pointer;

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }
`;

export const Divider = styled.div`
    height: 1px;
    margin: 4px 2px;
    background: ${({ theme }) => theme.colors.border.default};
`;
