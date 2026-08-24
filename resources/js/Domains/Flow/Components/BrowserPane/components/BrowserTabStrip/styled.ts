import styled from 'styled-components';

export const TabStrip = styled.div`
    display: flex;
    flex: 0 0 auto;
    gap: 2px;
    min-width: 0;
    padding: 6px 8px;
    overflow-x: auto;
    overflow-y: hidden;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    scrollbar-width: thin;
`;

export const TabButton = styled.button<{ $active: boolean }>`
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    position: relative;
    max-width: 220px;
    min-height: 28px;
    padding: 5px 10px;
    border: 0;
    border-radius: 6px;
    color: ${({ theme, $active }) => (
        $active ? theme.colors.text.primary : theme.colors.text.secondary
    )};
    background: ${({ theme, $active }) => (
        $active ? theme.colors.bg.tertiary : 'transparent'
    )};
    font-size: 11px;
    font-weight: ${({ $active }) => ($active ? 600 : 500)};
    opacity: ${({ $active }) => ($active ? 1 : 0.46)};
    cursor: ${({ $active }) => ($active ? 'default' : 'pointer')};
    transition: opacity 140ms ease, color 140ms ease, background 140ms ease;

    span {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
        opacity: ${({ $active }) => ($active ? 1 : 0.78)};
    }

    &:disabled {
        cursor: default;
    }
`;
