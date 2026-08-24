import styled from 'styled-components';

export const Wrapper = styled.div.attrs<{ 'data-folder-item-menu'?: string }>({ 'data-folder-item-menu': '' })`
    position: relative;
    flex-shrink: 0;
    opacity: 0;
    transition: opacity ${({ theme }) => theme.transition.fast};
`;

export const Button = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 22px;
    border: none;
    background: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Menu = styled.div<{ $up?: boolean }>`
    position: absolute;
    ${({ $up }) => $up ? 'bottom: 100%;' : 'top: 100%;'}
    right: 0;
    z-index: 50;
    min-width: 140px;
    padding: 4px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    animation: menuFadeIn 100ms ease;

    @keyframes menuFadeIn {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
    }
`;

export const MenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    border: none;
    background: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    font-size: 13px;
    color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};

    svg {
        color: ${({ theme, $danger }) => $danger ? theme.colors.accent.error : theme.colors.text.tertiary};
    }

    &:hover {
        background: ${({ theme, $danger }) => $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover};
    }
`;

export const Divider = styled.div`
    height: 1px;
    margin: 4px 0;
    background: ${({ theme }) => theme.colors.border.default};
`;
