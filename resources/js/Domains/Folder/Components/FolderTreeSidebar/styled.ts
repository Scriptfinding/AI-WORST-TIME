import styled from 'styled-components';

export const Sidebar = styled.aside<{ $width?: number }>`
    width: ${({ $width = 260 }) => $width}px;
    min-width: 220px;
    max-width: min(520px, calc(100vw - 420px));
    flex: 0 0 ${({ $width = 260 }) => $width}px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    display: flex;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const SidebarHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 16px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.light};
    flex-shrink: 0;

    svg {
        width: 14px;
        height: 14px;
    }
`;

export const TreeContainer = styled.div`
    flex: 1;
    overflow: auto;
    padding: 6px 0;
`;

export const TreeInner = styled.div`
    min-width: 100%;
    width: max-content;
`;
