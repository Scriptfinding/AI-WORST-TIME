import styled from 'styled-components';

export const Body = styled.form`
    display: flex;
    flex-direction: column;
    gap: 18px;
`;

export const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const SectionTitle = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Error = styled.div`
    padding: 9px 10px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error};
    border-radius: 6px;
    color: ${({ theme }) => theme.colors.accent.error};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    font-size: 12px;
`;

export const Footer = styled.div`
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
`;
