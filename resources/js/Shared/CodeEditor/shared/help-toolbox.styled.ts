import styled from 'styled-components';

export const HelpPanel = styled.div`
    position: absolute;
    right: 16px;
    bottom: 72px;
    width: min(760px, calc(100vw - 32px));
    height: min(560px, calc(100vh - 150px));
    display: flex;
    flex-direction: column;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
    z-index: 50;

    @media (max-width: 768px) {
        position: fixed;
        inset: 12px;
        z-index: 500;
        width: auto;
        height: auto;
        max-width: 100%;
    }
`;

export const HelpHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const HelpTitle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
        font-size: 13px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        font-size: 11px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const HelpToolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    flex-shrink: 0;
`;

export const HelpBody = styled.div`
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 190px 1fr;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const HelpCategoryRail = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 8px;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow: auto;

    @media (max-width: 768px) {
        flex-direction: row;
        align-items: center;
        border-right: none;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        overflow-x: auto;
        overflow-y: hidden;
    }
`;

export const HelpCategoryPageButton = styled.button<{ $active?: boolean; $color?: string }>`
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
    width: 100%;
    min-height: 36px;
    padding: 6px 8px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
    color: ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.accent.primary) : theme.colors.text.secondary)};
    background: ${({ $active, $color, theme }) => ($active ? ($color || theme.colors.accent.primary) + '14' : 'transparent')};

    &:hover {
        color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
        background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}10;
    }

    @media (max-width: 768px) {
        width: auto;
        white-space: nowrap;
    }
`;

export const HelpCategoryPageIcon = styled.span<{ $active?: boolean; $color?: string }>`
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
    flex-shrink: 0;

    ${({ $active, $color, theme }) => $active && `
        background: ${($color || theme.colors.accent.primary)}22;
    `}
`;

export const HelpEmptySearch = styled.div`
    text-align: center;
    padding: 32px 16px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const HelpPanelContent = styled.div`
    flex: 1;
    overflow-y: auto;
    padding: 12px;
`;
