import styled from 'styled-components';

export const Actions = styled.div`
    display: flex;
    gap: 2px;
`;

export const IconButton = styled.button<{ $danger?: boolean }>`
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.tertiary};
    border: 1px solid transparent;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme, $danger }) =>
            $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
        color: ${({ theme, $danger }) =>
            $danger ? theme.colors.accent.error : theme.colors.text.primary};
        border-color: ${({ theme, $danger }) =>
            $danger ? 'transparent' : theme.colors.border.default};
    }
`;
