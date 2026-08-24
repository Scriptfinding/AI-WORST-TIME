import styled from 'styled-components';

export const NodeConfigBackdrop = styled.div`
    position: fixed;
    inset: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    background: ${({ theme }) => theme.colors.bg.primary}cc;
    backdrop-filter: blur(3px);
    z-index: 1000;
    overflow-x: clip;
    cursor: default;
    user-select: text;

    * {
        cursor: auto;
        user-select: text;
    }

    button:not(:disabled),
    select:not(:disabled),
    [role='button'] {
        cursor: pointer;
    }

    input,
    textarea {
        cursor: text;
    }

    input:disabled,
    textarea:disabled,
    select:disabled {
        cursor: not-allowed;
        opacity: 1;
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
        border-color: ${({ theme }) => theme.colors.border.default};
        -webkit-text-fill-color: ${({ theme }) => theme.colors.text.secondary};
    }

    [draggable='true'] {
        cursor: grab;
    }
`;

export const NodeConfigShell = styled.div`
    position: relative;
    width: min(1360px, calc(100vw - 308px));
    height: calc(100vh - 32px);
    max-height: calc(100vh - 32px);

    @media (max-width: 1120px) {
        width: min(800px, 100%);
    }
`;

export const NodeConfigPanel = styled.div`
    width: 100%;
    height: 100%;
    max-height: 100%;
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
    user-select: text;
`;

export const NodeConfigBody = styled.div`
    flex: 1;
    min-height: 0;
    display: flex;
    overflow: hidden;
    padding: 16px;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const NodeConfigLayout = styled.div`
    flex: 1;
    height: 100%;
    min-height: 0;
    display: grid;
    grid-template-columns: minmax(190px, 0.75fr) minmax(420px, 1.35fr) minmax(190px, 0.75fr);
    gap: 12px;
    align-items: stretch;

    @media (max-width: 1024px) {
        grid-template-columns: 1fr;
    }
`;

export const NodeConfigFooter = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px 18px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const NodeConfigMeta = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const NodeConfigDone = styled.button`
    padding: 7px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    font-weight: 600;
    color: white;
    background: ${({ theme }) => theme.colors.accent.primary};
    cursor: pointer;

    &:hover {
        filter: brightness(1.05);
    }
`;
