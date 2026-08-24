import styled from 'styled-components';

export const InviteBanner = styled.div`
    padding: 10px 14px;
    font-size: 13px;
    line-height: 1.5;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.brand}40;
    background: ${({ theme }) => theme.colors.brand}12;
    color: ${({ theme }) => theme.colors.brand};
    margin-bottom: 8px;

    strong {
        font-weight: 600;
    }
`;
