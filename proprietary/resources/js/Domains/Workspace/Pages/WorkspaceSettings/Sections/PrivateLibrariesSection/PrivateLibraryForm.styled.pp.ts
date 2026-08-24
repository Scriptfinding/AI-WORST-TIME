import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 12px;
    margin-top: 12px;
    min-width: 0;
`;

export const Layout = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    min-width: 0;
`;

export const Fields = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: 12px;
    align-items: start;
    min-width: 0;
`;

export const Actions = styled.div`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: 12px;
    justify-content: flex-end;
`;

export const ErrorBox = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.4;
`;
