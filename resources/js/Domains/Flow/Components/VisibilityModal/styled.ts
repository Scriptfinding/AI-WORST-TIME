import styled from 'styled-components';

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const TransferBanner = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const TransferText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    flex: 1;
    min-width: 0;
`;

export const TransferTitle = styled.div`
    font-size: 12px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const TransferDesc = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.4;
`;

export const Separator = styled.hr`
    border: none;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    margin: 0;
`;

export const OwnerRow = styled.div`
    margin-top: -4px;
`;
