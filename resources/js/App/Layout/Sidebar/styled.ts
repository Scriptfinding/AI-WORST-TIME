import styled, { css } from 'styled-components';

export const Container = styled.aside<{ $mobileOpen?: boolean; $collapsed?: boolean }>`
    width: ${({ $collapsed }) => ($collapsed ? '60px' : '240px')};
    min-width: ${({ $collapsed }) => ($collapsed ? '60px' : '240px')};
    height: 100vh;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    display: flex;
    flex-direction: column;
    overflow: visible;
    position: relative;
    z-index: 20;
    transition:
        width 200ms ease,
        min-width 200ms ease;

    @media (max-width: 768px) {
        width: 240px;
        min-width: 240px;
        position: fixed;
        top: 0;
        left: 0;
        z-index: 200;
        transform: translateX(${({ $mobileOpen }) => ($mobileOpen ? '0' : '-100%')});
        transition: transform 200ms ease;
        box-shadow: ${({ $mobileOpen, theme }) => ($mobileOpen ? theme.shadow.lg : 'none')};
    }
`;

export const Brand = styled.div`
    padding: 12px 10px;
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const BrandLink = styled.a<{ $collapsed?: boolean }>`
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'flex')};
    align-items: center;
    gap: 10px;
    cursor: pointer;
    text-decoration: none;
    flex: 1;
    min-width: 0;

    &:hover {
        opacity: 0.8;
    }
`;

export const BrandIcon = styled.img`
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.md};
    object-fit: contain;
    flex-shrink: 0;
`;

export const BrandName = styled.span<{ $collapsed?: boolean }>`
    font-weight: 600;
    font-size: 15px;
    flex: 1;
    display: ${({ $collapsed }) => ($collapsed ? 'none' : 'inline')};
`;

export const MobileCloseButton = styled.button`
    display: none;
    align-items: center;
    justify-content: center;
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};

    svg {
        width: 18px;
        height: 18px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    @media (max-width: 768px) {
        display: flex;
    }
`;

export const CollapseButton = styled.button<{ $collapsed?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    ${({ $collapsed, theme }) =>
        $collapsed
            ? css`
                  position: absolute;
                  top: 12px;
                  right: -14px;
                  width: 14px;
                  height: 32px;
                  border-radius: 0 ${theme.radius.sm} ${theme.radius.sm} 0;
                  background: ${theme.colors.bg.secondary};
                  border: 1px solid ${theme.colors.border.default};
                  border-left: none;
                  z-index: 21;

                  svg {
                      width: 12px;
                      height: 12px;
                  }
              `
            : css`
                  width: 28px;
                  height: 28px;
                  border-radius: ${theme.radius.md};
                  margin-left: auto;
              `}

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    @media (max-width: 768px) {
        display: none;
    }
`;
