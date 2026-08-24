import styled from 'styled-components';

export const Container = styled.div`
    display: flex;
    height: 100vh;
    overflow-y: hidden;
`;

export const SidebarOverlay = styled.div<{ $open: boolean }>`
    display: none;

    @media (max-width: 768px) {
        display: ${({ $open }) => ($open ? 'block' : 'none')};
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.5);
        z-index: 199;
    }
`;

export const Main = styled.main`
    flex: 1;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    min-width: 0;
`;

export const Header = styled.header`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 24px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    min-height: 56px;
    flex-shrink: 0;
    gap: 30px;
    position: sticky;
    top: 0;
    z-index: 20;

    @media (max-width: 768px) {
        padding: 8px 16px;
        gap: 8px;
    }
`;

export const HeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    min-width: 0;
    flex: 1;
`;

export const HeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
`;

export const BurgerButton = styled.button`
    display: none;
    align-items: center;
    justify-content: center;
    padding: 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    transition: background ${({ theme }) => theme.transition.fast};
    flex-shrink: 0;

    svg {
        width: 20px;
        height: 20px;
    }

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }

    @media (max-width: 768px) {
        display: flex;
    }
`;

export const MobileMenuBar = styled.div`
    display: none;

    @media (max-width: 768px) {
        display: flex;
        align-items: center;
        padding: 4px 10px;
        flex-shrink: 0;
        background: ${({ theme }) => theme.colors.bg.secondary};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    }
`;

export const PageTitle = styled.h1`
    flex: 1;
    font-size: 16px;
    font-weight: 600;
    min-width: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    @media (max-width: 768px) {
        font-size: 14px;
    }
`;

export const Content = styled.div<{ $noPadding?: boolean }>`
    flex: 1;
    padding: ${({ $noPadding }) => ($noPadding ? '0' : '24px')};
    display: flex;
    flex-direction: column;
    min-height: 0;

    @media (max-width: 768px) {
        padding: ${({ $noPadding }) => ($noPadding ? '0' : '16px')};
    }
`;

export const SafeModeBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 20px;
    background: #f97316;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
    text-align: center;

    strong {
        font-weight: 800;
    }

    @media (max-width: 768px) {
        align-items: flex-start;
        justify-content: flex-start;
        padding: 9px 16px;
        text-align: left;
    }
`;

export const WorkspaceExpirationBanner = styled.div<{ $expired: boolean }>`
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 10px;
    min-height: 44px;
    padding: 7px 24px;
    overflow: hidden;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background:
        radial-gradient(
            circle at 18% 50%,
            ${({ theme, $expired }) =>
                $expired ? theme.colors.accent.errorBg : `${theme.colors.brand}14`} 0,
            transparent 34%
        ),
        linear-gradient(
            105deg,
            ${({ theme, $expired }) =>
                $expired ? theme.colors.accent.errorBg : `${theme.colors.brand}14`} 0%,
            ${({ theme }) => theme.colors.bg.secondary} 48%,
            ${({ theme, $expired }) =>
                $expired ? theme.colors.accent.errorBg : `${theme.colors.brand}14`} 100%
        );
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
    text-align: center;

    &::after {
        position: absolute;
        inset: 0;
        background-image: repeating-linear-gradient(
            120deg,
            transparent 0,
            transparent 18px,
            ${({ theme, $expired }) =>
                $expired ? theme.colors.accent.errorBg : `${theme.colors.brand}14`} 19px,
            transparent 20px
        );
        content: '';
        opacity: 0.45;
        pointer-events: none;
    }

    @media (max-width: 768px) {
        align-items: flex-start;
        justify-content: flex-start;
        padding: 8px 16px;
        text-align: left;
    }
`;

export const WorkspaceExpirationIcon = styled.span<{ $expired: boolean }>`
    position: relative;
    z-index: 1;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme, $expired }) =>
        $expired ? theme.colors.accent.error : theme.colors.brand};
`;

export const WorkspaceExpirationMessage = styled.span`
    position: relative;
    z-index: 1;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 700;
    }
`;

export const RunQuotaBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 20px;
    background: #dc2626;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
    text-align: center;

    strong {
        font-weight: 800;
    }

    @media (max-width: 768px) {
        align-items: flex-start;
        justify-content: flex-start;
        padding: 9px 16px;
        text-align: left;
    }
`;

export const ImpersonateBanner = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 20px;
    background: #d97706;
    color: #fff;
    font-size: 13px;
    font-weight: 500;
    flex-shrink: 0;
`;

export const ImpersonateText = styled.span`
    display: flex;
    align-items: center;
    gap: 8px;

    strong {
        font-weight: 700;
    }
`;

export const ImpersonateLeave = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 4px 12px;
    font-size: 12px;
    font-weight: 600;
    color: #d97706;
    background: #fff;
    border-radius: 6px;
    cursor: pointer;
    transition: opacity 150ms ease;
    flex-shrink: 0;

    &:hover {
        opacity: 0.85;
    }
`;

export const Toast = styled.div<{ $type: 'success' | 'error' }>`
    position: fixed;
    bottom: 20px;
    right: 20px;
    padding: 12px 20px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    font-weight: 500;
    z-index: 9999;
    animation: slideIn 200ms ease;
    background: ${({ theme, $type }) =>
        $type === 'success' ? theme.colors.accent.success : theme.colors.accent.error};
    color: white;
    box-shadow: ${({ theme }) => theme.shadow.lg};

    @media (max-width: 768px) {
        bottom: 70px;
        left: 20px;
    }

    @keyframes slideIn {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;
