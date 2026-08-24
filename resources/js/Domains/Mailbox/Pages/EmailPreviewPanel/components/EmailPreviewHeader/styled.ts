import styled from 'styled-components';

export const BackBtn = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 4px;
    background: none;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const PreviewActions = styled.div`
    display: flex;
    gap: 6px;
    flex-shrink: 0;
`;

export const PreviewActionButton = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ $danger, theme }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.secondary};
        border-color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.border.light};
    }
`;
