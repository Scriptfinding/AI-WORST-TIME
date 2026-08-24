import styled from 'styled-components';

export const DangerCard = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    padding: 20px 24px;
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const DangerTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const DangerDescription = styled.div`
    font-size: 12px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 4px;
`;

export const DeleteOverlay = styled.div`
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.6);
    backdrop-filter: blur(4px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1100;
    animation: deleteFadeIn 150ms ease;

    @keyframes deleteFadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
`;

export const DeleteDialog = styled.div`
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    width: 420px;
    max-width: 90vw;
    padding: 28px 24px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    text-align: center;
    animation: deleteSlideUp 200ms ease;

    @keyframes deleteSlideUp {
        from { transform: translateY(10px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
`;

export const DeleteIconCircle = styled.div`
    width: 56px;
    height: 56px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.accent.error}18;
    border: 2px solid ${({ theme }) => theme.colors.accent.error}30;
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.accent.error};
    margin-bottom: 16px;
`;

export const DeleteTitle = styled.h3`
    font-size: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin-bottom: 8px;
`;

export const DeleteMessage = styled.p`
    font-size: 13px;
    line-height: 1.5;
    color: ${({ theme }) => theme.colors.text.secondary};

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
    }
`;

export const DeleteInputLabel = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: 8px;
    align-self: stretch;
    text-align: left;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
    }
`;

export const DeleteActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    width: 100%;
    margin-top: 16px;
`;
