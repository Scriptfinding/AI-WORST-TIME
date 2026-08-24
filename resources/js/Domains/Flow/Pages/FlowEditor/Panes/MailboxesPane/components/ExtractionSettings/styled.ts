import styled from 'styled-components';

export const ExtractSection = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const ExtractModeRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const ExtractModeSelect = styled.select`
    padding: 6px 8px;
    font-size: 12px;
    border-radius: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    flex-shrink: 0;
`;
