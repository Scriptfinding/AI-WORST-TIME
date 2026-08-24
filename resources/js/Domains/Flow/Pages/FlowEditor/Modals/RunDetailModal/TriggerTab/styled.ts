import styled from 'styled-components';

export const ArtifactSection = styled.div`
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow: auto;
`;

export const ArtifactSectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const MetaDetailGrid = styled.div`
    display: flex;
    flex-direction: column;
    gap: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
`;

export const MetaDetailRow = styled.div`
    display: flex;
    align-items: baseline;
    gap: 12px;
    padding: 8px 12px;
    font-size: 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    &:last-child {
        border-bottom: none;
    }

    &:nth-child(even) {
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const MetaDetailKey = styled.span`
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    flex-shrink: 0;
    min-width: 80px;
`;

export const MetaDetailValue = styled.span`
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    word-break: break-all;
    white-space: pre-wrap;
`;
