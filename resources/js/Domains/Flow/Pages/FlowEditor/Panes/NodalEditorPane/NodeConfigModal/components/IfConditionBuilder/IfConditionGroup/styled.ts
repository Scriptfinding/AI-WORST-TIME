import styled from 'styled-components';

export const ConditionField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const ConditionHeader = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 12px;

    label {
        display: block;
        margin-bottom: 5px;
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const CombinatorToggle = styled.div`
    display: inline-flex;
    gap: 2px;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};

    button {
        padding: 4px 8px;
        border-radius: ${({ theme }) => theme.radius.sm};
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
        font-weight: 700;
        cursor: pointer;
    }

    button[data-active='true'] {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    button:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;

export const ConditionRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
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
