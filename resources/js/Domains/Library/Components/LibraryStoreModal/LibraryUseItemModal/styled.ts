import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DestinationFields = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 14px;

    @media (max-width: 680px) {
        grid-template-columns: 1fr;
    }
`;

export const ErrorBox = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 13px;
`;

export const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    padding-top: 8px;
`;
