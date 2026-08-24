import styled from 'styled-components';

export const Overlay = styled.div<{ $transparent?: boolean; $zIndex?: number }>`
    position: fixed;
    inset: 0;
    background: ${({ $transparent }) => $transparent ? 'transparent' : 'rgba(0, 0, 0, 0.6)'};
    backdrop-filter: ${({ $transparent }) => $transparent ? 'none' : 'blur(4px)'};
    display: flex;
    align-items: flex-start;
    justify-content: center;
    z-index: ${({ $zIndex }) => $zIndex ?? 1000};
    overflow-y: auto;
    padding: 40px 0;
    animation: fadeIn 150ms ease;

    @keyframes fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

export const Container = styled.div<{ $width?: string; $fullScreen?: boolean }>`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ $fullScreen, theme }) => $fullScreen ? theme.radius.md : theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    width: ${({ $width, $fullScreen }) => $fullScreen ? '94vw' : ($width || '480px')};
    max-width: ${({ $fullScreen }) => $fullScreen ? '94vw' : '90vw'};
    height: ${({ $fullScreen }) => $fullScreen ? '92vh' : 'auto'};
    max-height: ${({ $fullScreen }) => $fullScreen ? '92vh' : 'none'};
    display: flex;
    flex-direction: column;
    overflow: ${({ $fullScreen }) => $fullScreen ? 'hidden' : 'visible'};
    flex-shrink: 0;
    margin: auto 0;
    outline: none;
    animation: slideUp 200ms ease;

    @keyframes slideUp {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

export const Header = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
`;

export const TitleGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const Title = styled.h3`
    font-size: 15px;
    font-weight: 600;
`;

export const Caption = styled.span`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-weight: 400;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const HeaderExtra = styled.div`
    margin-top: 4px;
    min-width: 0;
`;

export const CloseButton = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 4px;
    display: flex;
    border-radius: ${({ theme }) => theme.radius.sm};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Body = styled.div<{ $fullScreen?: boolean }>`
    padding: ${({ $fullScreen }) => $fullScreen ? '0' : '20px'};
    overflow-y: ${({ $fullScreen }) => $fullScreen ? 'hidden' : 'visible'};
    flex: ${({ $fullScreen }) => $fullScreen ? '1' : 'unset'};
    min-height: 0;
    ${({ $fullScreen }) => $fullScreen ? 'display: flex; flex-direction: column;' : ''}
`;

export const Footer = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding: 12px 20px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    flex-wrap: wrap;
`;
