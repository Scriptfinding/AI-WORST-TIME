import styled from 'styled-components';

export const EvalButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    border-radius: 50%;
    flex-shrink: 0;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    transition: all ${({ theme }) => theme.transition.fast};

    svg {
        width: 11px;
        height: 11px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        border-color: ${({ theme }) => theme.colors.accent.primary}60;
        background: ${({ theme }) => theme.colors.accent.primary}12;
    }
`;

export const EvalOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    backdrop-filter: blur(3px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: evalFadeIn 120ms ease;

    @keyframes evalFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

export const EvalModal = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    width: 420px;
    max-width: 90vw;
    overflow: hidden;
    animation: evalSlideUp 180ms ease;

    @keyframes evalSlideUp {
        from { transform: translateY(8px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

export const EvalHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const EvalTitle = styled.span`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const EvalClose = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;

    svg {
        width: 14px;
        height: 14px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const EvalBody = styled.div`
    padding: 16px;
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const EvalLabel = styled.div`
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 4px;
`;

export const EvalExpr = styled.div`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const EvalResult = styled.pre<{ $error?: boolean }>`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    color: ${({ $error, theme }) =>
        $error ? theme.colors.accent.error : theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    padding: 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ $error, theme }) =>
        $error ? theme.colors.accent.error + '40' : theme.colors.border.default};
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    max-height: 240px;
    overflow-y: auto;
`;
