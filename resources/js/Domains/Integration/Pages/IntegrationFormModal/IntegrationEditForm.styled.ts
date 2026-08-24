import styled from 'styled-components';

export const ExternalBanner = styled.a`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    text-decoration: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: border-color 150ms, background 150ms;

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary}50;
        background: ${({ theme }) => theme.colors.accent.primary}08;
    }

    > svg:last-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ExternalBannerIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    width: 32px;
    height: 32px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ExternalBannerText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;

    > span:first-child {
        font-size: 13px;
        font-weight: 500;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ExternalBannerHint = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.3;
`;

export const WebhookField = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const WebhookRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: end;
    gap: 8px;

    > button {
        margin-bottom: 4px;
    }
`;

export const WebhookHint = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
`;
