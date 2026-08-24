import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
`;

export const Button = styled.button.attrs<{ 'data-sidebar-overflow-button'?: string }>({ 'data-sidebar-overflow-button': '' })`
    display: none;
    align-items: center;
    justify-content: center;
    width: 15px;
    height: 15px;
    border: none;
    background: none;
    border-radius: 3px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    svg {
        width: 13px;
        height: 13px;
    }
`;

export const Menu = styled.div`
    position: fixed;
    z-index: 100;
    min-width: 160px;
    padding: 4px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    animation: sidebarMenuIn 100ms ease;

    @keyframes sidebarMenuIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;
