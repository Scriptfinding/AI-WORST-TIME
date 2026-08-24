import styled from 'styled-components';

export const ConditionRow = styled.div`
    position: relative;
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    align-items: start;
    padding: 10px 40px 10px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const OperatorSlot = styled.div`
    grid-column: 1 / 2;
`;

export const RightOperandRow = styled.div`
    grid-column: 1 / 2;
`;

export const RemoveButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover:not(:disabled) {
        color: #ef4444;
    }

    &:disabled {
        cursor: default;
        opacity: 0.35;
    }
`;
