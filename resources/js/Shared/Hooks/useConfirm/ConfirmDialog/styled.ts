import styled from 'styled-components';
import type { ConfirmVariant } from './ConfirmDialog';

export const Overlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    animation: confirmFadeIn 150ms ease;

    @keyframes confirmFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

export const Dialog = styled.div<{ $variant: ConfirmVariant }>`
    position: relative;
    overflow: hidden;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $variant }) =>
        $variant === 'danger' ? `${theme.colors.accent.error}35` : theme.colors.border.default};
    border-radius: 16px;
    box-shadow:
        ${({ theme }) => theme.shadow.lg},
        0 24px 70px rgba(0, 0, 0, 0.24);
    width: 440px;
    max-width: 90vw;
    animation: confirmSlideUp 220ms cubic-bezier(0.22, 1, 0.36, 1);

    &::before {
        position: absolute;
        top: -90px;
        left: -60px;
        width: 220px;
        height: 150px;
        border-radius: 50%;
        background: ${({ theme, $variant }) =>
            $variant === 'danger' ? theme.colors.accent.errorBg : theme.colors.accent.infoBg};
        filter: blur(28px);
        content: '';
        pointer-events: none;
    }

    @keyframes confirmSlideUp {
        from { transform: translateY(14px) scale(0.98); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

export const DialogHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 20px 22px 0;
    position: relative;
`;

export const DialogIcon = styled.span<{ $variant: ConfirmVariant }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 38px;
    height: 38px;
    border: 1px solid ${({ theme, $variant }) =>
        $variant === 'danger' ? `${theme.colors.accent.error}30` : `${theme.colors.accent.info}30`};
    border-radius: 11px;
    flex-shrink: 0;
    background: ${({ theme, $variant }) =>
        $variant === 'danger' ? theme.colors.accent.errorBg : theme.colors.accent.infoBg};
    color: ${({ theme, $variant }) =>
        $variant === 'danger' ? theme.colors.accent.error : theme.colors.accent.info};
`;

export const DialogTitle = styled.h3`
    flex: 1;
    font-size: 16px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const DialogClose = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    flex-shrink: 0;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const DialogBody = styled.div`
    position: relative;
    padding: 16px 22px 22px;
    font-size: 13px;
    line-height: 1.5;
    word-break: normal;
    overflow-wrap: anywhere;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const DialogFooter = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 14px 22px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
`;
