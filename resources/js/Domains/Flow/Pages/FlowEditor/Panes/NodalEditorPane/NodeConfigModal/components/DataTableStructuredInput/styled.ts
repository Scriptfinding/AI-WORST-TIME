import styled from 'styled-components';
import {
    ExpressionField,
    NodeFieldHeader,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/styled';

export const Root = styled.div<{ $invalid?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 10px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ $invalid }) => ($invalid ? '0 0 0 2px #ef444426' : 'none')};
`;

export const Header = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;

    > div:first-child {
        flex: 1;
        min-width: 0;
    }

    label {
        display: block;
        margin-bottom: 3px;
        font-size: 12px;
        font-weight: 600;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Help = styled.div`
    font-size: 12px;
    line-height: 1.4;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Rows = styled.div<{ $tight?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: ${({ $tight }) => ($tight ? '5px' : '10px')};
`;

export const FilterCard = styled.div`
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

export const FilterSelects = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    gap: 8px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const ColumnNameField = styled.div`
    min-width: 0;

    ${ExpressionField} {
        grid-template-columns: minmax(0, 1fr);
        padding: 0;

        ${NodeFieldHeader} {
            display: none;
        }

        ${NodeFieldHeader} + * {
            grid-column: 1;
        }

        /* Match the height of the type CustomSelect trigger (38px). */
        input:not([data-object-key-input]) {
            min-height: 38px;
        }
    }
`;

export const ColumnRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) minmax(140px, 0.5fr) 30px;
    align-items: center;
    gap: 8px;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const RemoveButton = styled.button`
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: 0;
    background: transparent;
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

export const CardRemoveButton = styled(RemoveButton)`
    position: absolute;
    top: 8px;
    right: 8px;
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

export const Empty = styled.div`
    padding: 12px;
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    text-align: center;
`;
