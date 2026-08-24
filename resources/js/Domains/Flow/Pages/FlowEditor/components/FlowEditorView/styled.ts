import styled from 'styled-components';

export const TitleBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const Container = styled.div`
    display: flex;
    height: calc(100vh - 56px);
    overflow: hidden;
    position: relative;

    @media (max-width: 768px) {
        flex-direction: column;
        height: calc(100vh - 56px - 52px);
    }
`;

export const ExternalUpdateBanner = styled.div`
    position: fixed;
    top: 68px;
    left: 50%;
    z-index: 120;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 18px;
    width: min(920px, calc(100vw - 32px));
    padding: 12px 14px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}55;
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    color: ${({ theme }) => theme.colors.text.secondary};
    transform: translateX(-50%);

    @media (max-width: 768px) {
        top: 64px;
        flex-direction: column;
        align-items: stretch;
        gap: 12px;
    }
`;

export const ExternalUpdateContent = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    min-width: 0;

    > svg {
        flex-shrink: 0;
        margin-top: 1px;
        color: ${({ theme }) => theme.colors.accent.warning};
    }
`;

export const ExternalUpdateTitle = styled.div`
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 700;
`;

export const ExternalUpdateMessage = styled.div`
    margin-top: 2px;
    font-size: 12px;
    line-height: 1.4;
`;

export const ExternalUpdateActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;

    @media (max-width: 768px) {
        justify-content: flex-end;
    }
`;

export const ExternalUpdateButton = styled.button<{ $primary?: boolean }>`
    padding: 6px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme, $primary }) => ($primary ? theme.colors.accent.primary : theme.colors.border.default)};
    background: ${({ theme, $primary }) => ($primary ? theme.colors.accent.primary : theme.colors.bg.secondary)};
    color: ${({ theme, $primary }) => ($primary ? 'white' : theme.colors.text.primary)};
    font-size: 12px;
    font-weight: 700;
    cursor: pointer;
    transition: opacity ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        opacity: 0.9;
    }

    &:disabled {
        cursor: wait;
        opacity: 0.65;
    }
`;

export const SidePanelResizeHandle = styled.div`
    width: 2px;
    flex-shrink: 0;
    position: relative;
    z-index: 20;
    cursor: col-resize;
    background: ${({ theme }) => theme.colors.border.default};
    transition: background ${({ theme }) => theme.transition.fast};

    &::before {
        content: '';
        position: absolute;
        inset: 0 -5px;
    }

    &:hover,
    &:active {
        background: ${({ theme }) => theme.colors.accent.primary};
    }

    @media (max-width: 768px) {
        display: none;
    }
`;
