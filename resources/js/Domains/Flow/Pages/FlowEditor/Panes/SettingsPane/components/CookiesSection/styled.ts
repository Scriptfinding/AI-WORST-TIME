import styled from 'styled-components';

export const InfoBanner = styled.div`
    margin-top: 20px;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const InfoBannerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const InfoBannerDescription = styled.div`
    font-size: 11px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 2px;
`;
