import styled from 'styled-components';

export const EdgeActionZone = styled.div`
    position: absolute;
    width: 96px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    transform: translate(-50%, -50%);
    z-index: 3;
`;

export const EdgeActionGroup = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding: 3px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast};

    ${EdgeActionZone}:hover &,
    ${EdgeActionZone}:focus-within & {
        opacity: 1;
        pointer-events: auto;
    }
`;

export const EdgeActionButton = styled.button<{ $danger?: boolean }>`
    width: 22px;
    height: 22px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: transparent;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
