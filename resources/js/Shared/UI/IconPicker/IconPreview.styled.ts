import styled from 'styled-components';

export const PreviewRow = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
`;

export const PreviewInfo = styled.div`
    flex: 1;
`;

export const PreviewLabel = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const PreviewHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: 2px;
`;
