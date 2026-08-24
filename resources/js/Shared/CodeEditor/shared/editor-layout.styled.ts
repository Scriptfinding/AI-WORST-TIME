import styled from 'styled-components';

export const FloatingHelpButton = styled.button`
    position: absolute;
    right: 16px;
    bottom: 16px;
    width: 44px;
    height: 44px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 50%;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}66;
    background: ${({ theme }) => theme.colors.accent.primary};
    color: white;
    cursor: pointer;
    box-shadow: ${({ theme }) => theme.shadow.lg};
    z-index: 20;

    svg {
        width: 20px;
        height: 20px;
    }
`;
