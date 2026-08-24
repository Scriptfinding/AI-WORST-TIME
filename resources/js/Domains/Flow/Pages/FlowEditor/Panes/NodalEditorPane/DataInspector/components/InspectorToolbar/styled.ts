import styled from 'styled-components';

export const Header = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};

    strong {
        font-size: 12px;
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const Actions = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
`;

export const ActionButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 10px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Tabs = styled.div`
    display: inline-flex;
    gap: 2px;
`;

export const Tab = styled.button<{ $active?: boolean }>`
    padding: 3px 5px;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 10px;
    text-transform: capitalize;
    color: ${({ theme, $active }) => ($active ? theme.colors.text.primary : theme.colors.text.tertiary)};
    background: ${({ theme, $active }) => ($active ? theme.colors.bg.hover : 'transparent')};
    cursor: pointer;
`;
