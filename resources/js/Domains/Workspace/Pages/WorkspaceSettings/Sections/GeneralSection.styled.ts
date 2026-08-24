import styled from 'styled-components';

export const CardRow = styled.div`
    flex-direction: row;
    gap: 12px;
`;

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

export const FormActions = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
`;

export const Separator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 12px 0;
`;
