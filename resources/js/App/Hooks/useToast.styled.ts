import styled, { keyframes } from 'styled-components';

const slideIn = keyframes`
    from {
        opacity: 0;
        transform: translateY(8px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
`;

export const ToastContainer = styled.div`
    position: fixed;
    bottom: 20px;
    right: 20px;
    z-index: 10000;
    display: flex;
    flex-direction: column;
    gap: 6px;
    pointer-events: none;
`;

export const ToastItem = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: ${({ theme }) => theme.colors.text.primary};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.bg.primary};
    font-size: 12px;
    font-weight: 500;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.25);
    animation: ${slideIn} 150ms ease;
    pointer-events: auto;
`;
