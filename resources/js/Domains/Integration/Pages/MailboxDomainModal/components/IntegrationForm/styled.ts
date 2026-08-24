import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Hint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
    margin-top: -8px;
`;

export const ErrorMessage = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 8px;
`;
