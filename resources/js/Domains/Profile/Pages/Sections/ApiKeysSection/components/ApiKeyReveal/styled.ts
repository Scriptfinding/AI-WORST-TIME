import styled from 'styled-components';

export const Banner = styled.div`
    padding: 14px;
    margin-bottom: 16px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}40;
    background: ${({ theme }) => theme.colors.accent.primary}08;
`;

export const Header = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.accent.primary};
    margin-bottom: 10px;
`;

export const KeyRow = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 8px;
`;

export const KeyValue = styled.code`
    flex: 1;
    min-width: 0;
    padding: 8px 10px;
    font-size: 12px;
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-all;
    line-height: 1.4;
`;

export const CopyButton = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    flex-shrink: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DismissButton = styled.button`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: none;
    border: none;
    cursor: pointer;
    padding: 0;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
