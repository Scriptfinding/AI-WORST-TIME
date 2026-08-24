import styled from 'styled-components';

export const TesterBar = styled.div`
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const TesterHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 12px;
    min-width: 0;
    overflow: hidden;

    @media (max-width: 520px) {
        gap: 6px;
        padding: 8px;
    }
`;

export const TesterToggle = styled.button`
    display: flex;
    align-items: center;
    gap: 5px;
    flex: 0 0 auto;
    white-space: nowrap;
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    padding: 0;

    &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
`;

export const TesterModeSelect = styled.select`
    box-sizing: border-box;
    padding: 6px 8px;
    font-size: 12px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    flex: 0 1 82px;
    min-width: 62px;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        outline: none;
    }

    @media (max-width: 520px) {
        padding: 6px;
    }
`;

export const TesterInput = styled.input`
    box-sizing: border-box;
    flex: 1 1 auto;
    min-width: 0;
    width: 100%;
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 12px;
    padding: 6px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const TesterError = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
`;

export const MatchCount = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
`;

export const TesterResults = styled.div`
    max-height: 200px;
    overflow-y: auto;
    padding: 0 12px 10px;
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const TesterMatch = styled.div`
    font-family: 'JetBrains Mono', 'Fira Code', monospace;
    font-size: 11px;
    line-height: 1.4;
    padding: 4px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    white-space: pre-wrap;
    word-break: break-all;
`;

export const MatchIndex = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-right: 6px;
    user-select: none;
`;

export const GroupLabel = styled.span`
    font-size: 10px;
    color: ${({ theme }) => theme.colors.accent.primary};
    margin-right: 4px;
`;

export const EmptyResults = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 0 12px 10px;
    font-style: italic;
`;
