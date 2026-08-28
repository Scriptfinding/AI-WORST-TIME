import styled from 'styled-components';

export const Content = styled.div`
    display: flex;
    flex-direction: column;
    gap: 14px;
`;

export const Description = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.55;
`;

export const Selection = styled.div`
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const SelectionHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 9px 11px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 600;
`;

export const Count = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    min-width: 20px;
    height: 20px;
    padding: 0 6px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 10px;
`;

export const List = styled.div`
    max-height: 196px;
    overflow-y: auto;
    padding: 4px;
`;

export const Item = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-height: 42px;
    padding: 6px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};

    & + & {
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
        border-radius: 0;
    }

    > svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        opacity: 0.6;
    }
`;

export const ItemIcon = styled.span`
    display: inline-flex;
    flex-shrink: 0;
`;

export const ItemCopy = styled.span`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
`;

export const ItemTitle = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ItemSubtitle = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Warning = styled.div`
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 10px 11px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}30;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 11px;
    font-weight: 600;
`;

export const WarningIcon = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    flex-shrink: 0;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.primary};
`;
