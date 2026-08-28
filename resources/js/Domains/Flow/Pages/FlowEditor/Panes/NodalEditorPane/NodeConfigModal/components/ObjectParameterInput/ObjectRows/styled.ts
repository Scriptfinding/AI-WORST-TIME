import styled from 'styled-components';
import {
    ExpressionField,
    NodeFieldHeader,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/styled';

export const FormRow = styled.div`
    position: relative;
    width: 100%;
`;

export const KeyValueRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 10px;
    align-items: start;

    @media (max-width: 720px) {
        grid-template-columns: 1fr;
    }
`;

export const FieldKeyInput = styled.input`
    width: 100%;
    min-width: 0;
    flex: 1;
    height: 30px;
    margin-top: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    box-sizing: border-box;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    line-height: 30px;
    font-weight: 600;
    background: transparent;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const CustomFieldHeader = styled.div`
    flex: 1;
    width: 100%;
    min-width: 0;
    min-height: 30px;
    display: flex;
    align-items: center;
    gap: 8px;
`;

/* Hosts a compact ExpressionInput for the field name: hides its own label
   and keeps the input sized like the surrounding header controls. */
export const KeyExpressionField = styled.div`
    flex: 1;
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

        input {
            min-height: 30px;
            padding: 6px 8px;
            font-size: 12px;
            font-weight: 600;
        }
    }
`;
