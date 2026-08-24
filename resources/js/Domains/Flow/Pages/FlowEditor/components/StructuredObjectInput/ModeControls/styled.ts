import styled from 'styled-components';

export const Controls = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
`;

export const ExpandButton = styled.button`
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.primary};
    cursor: pointer;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }
`;
