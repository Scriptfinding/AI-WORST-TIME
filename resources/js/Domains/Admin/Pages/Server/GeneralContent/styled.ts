import styled from 'styled-components';

export const DocsBanner = styled.a`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 14px 16px;
    border: 1px solid var(--pf-border-default);
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    transition: border-color 0.15s;

    &:hover {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const DocsBannerText = styled.div`
    flex: 1;
`;

export const DocsBannerIcon = styled.span`
    display: inline-flex;
    align-self: flex-start;
    margin-top: 1px;
`;

export const DocsBannerTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
`;

export const DocsBannerDescription = styled.div`
    margin-top: 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
