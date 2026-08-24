import styled from 'styled-components';

export const Layout = styled.div`
    display: flex;
    flex: 1;
    min-height: 0;
    min-width: 0;
    gap: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    overflow: hidden;
`;

export const CodePane = styled.div`
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 300px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    padding: 12px;

    @media (max-width: 768px) {
        display: none;
    }
`;

export const ResizeHandle = styled.div`
    width: 2px;
    cursor: col-resize;
    flex-shrink: 0;
    position: relative;
    z-index: 10;
    background: ${({ theme }) => theme.colors.bg.secondary};

    &::after {
        content: '';
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        width: 2px;
        background: ${({ theme }) => theme.colors.border.default};
        transition: background 150ms ease;
    }

    &:hover::after,
    &:active::after {
        background: ${({ theme }) => theme.colors.accent.primary};
        left: 0;
        width: 2px;
        border-radius: 2px;
    }

    @media (max-width: 768px) {
        display: none;
    }
`;

export const RightPane = styled.div`
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    min-width: 300px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    padding: 0 12px 12px;
    overflow: hidden;
`;
