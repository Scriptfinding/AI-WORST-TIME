import styled from 'styled-components';

export const NodeButton = styled.button<{ $invalid?: boolean }>`
    width: 118px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    background: transparent;
    border: 0;
    box-shadow: none;
    cursor: pointer;
    user-select: none;
    transition: transform ${({ theme }) => theme.transition.fast};

    &:hover {
        transform: translateY(-2px);
    }
`;

export const NodeTile = styled.div<{ $invalid?: boolean }>`
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ $invalid, theme }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ $invalid, theme }) => ($invalid ? `0 0 0 3px #ef444433, ${theme.shadow.md}` : theme.shadow.md)};
`;

export const NodeIcon = styled.div<{ $color?: string }>`
    width: 40px;
    height: 40px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
    flex-shrink: 0;
`;

export const NodeLabel = styled.span`
    width: 100%;
    min-height: 28px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-align: center;
    font-size: 11px;
    line-height: 14px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-word;
`;
