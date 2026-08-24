import styled from 'styled-components';

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
    align-items: center;
    gap: 6px;
    position: relative;
`;

export const OverflowWrapper = styled.div`
    position: relative;
    flex-shrink: 0;
`;

export const OverflowButton = styled.button`
    width: 30px;
    height: 30px;
    border-radius: ${({ theme }) => theme.radius.md};
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.secondary};
    transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const OverflowMenu = styled.div`
    position: absolute;
    top: calc(100% + 6px);
    right: 0;
    z-index: 2000;
    min-width: 150px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    padding: 6px;
`;

export const DangerMenuItem = styled.button`
    width: 100%;
    display: flex;
    align-items: center;
    gap: 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    padding: 8px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.errorBg};
    }
`;
