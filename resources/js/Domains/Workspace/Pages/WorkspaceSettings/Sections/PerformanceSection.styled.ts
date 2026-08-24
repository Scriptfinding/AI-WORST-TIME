import styled from 'styled-components';

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
    min-width: 0;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const FieldHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: -5px;
    line-height: 1.4;
`;

export const Divider = styled.div`
    width: 100%;
    border-top: 1px solid var(--pf-border-default);
`;

export const FormActions = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
`;
