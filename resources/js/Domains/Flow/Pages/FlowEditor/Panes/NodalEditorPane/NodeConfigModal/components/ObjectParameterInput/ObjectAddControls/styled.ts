import styled from 'styled-components';

export const AddRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const AddButton = styled.button`
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }
`;
