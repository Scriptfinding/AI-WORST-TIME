import styled from 'styled-components';

export const GetterRows = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const GetterRow = styled.div<{ $invalid?: boolean }>`
    display: grid;
    grid-template-columns: minmax(90px, 0.8fr) minmax(150px, 1fr) auto;
    gap: 8px;
    align-items: center;
    padding: 8px;
    border: 1px solid ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};

    @media (max-width: 720px) {
        grid-template-columns: 1fr auto;
    }
`;

const RowInput = styled.input`
    width: 100%;
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    box-sizing: border-box;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    font-size: 12px;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.light};
    }
`;

export const OutputKeyInput = styled(RowInput)``;

export const AttributeInput = styled(RowInput)`
    grid-column: 1 / -2;
`;

export const RemoveButton = styled.button`
    width: 32px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: #ef4444;
    }

    &:disabled {
        cursor: default;
        opacity: 0.45;
    }
`;

export const AddButton = styled.button`
    width: fit-content;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 5px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: transparent;
    font-size: 11px;
    font-weight: 600;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: default;
        opacity: 0.45;
    }
`;

export const RowError = styled.span`
    grid-column: 1 / -1;
    font-size: 11px;
    color: #ef4444;
`;
