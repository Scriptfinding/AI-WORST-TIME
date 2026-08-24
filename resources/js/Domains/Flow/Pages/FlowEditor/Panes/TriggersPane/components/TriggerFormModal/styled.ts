import styled from 'styled-components';

export const Form = styled.form`
    display: flex;
    padding-top: 16px;
    flex-direction: column;
    gap: 12px;
`;

export const Actions = styled.div`
    display: flex;
    justify-content: flex-end;
`;

export const CopyInputGroup = styled.div`
    position: relative;

    input {
        box-sizing: border-box;
        height: 34px;
        padding-right: 40px !important;
        font-family: 'JetBrains Mono', 'Fira Code', monospace;
        font-size: 12px !important;
    }
`;

export const CopyInputButton = styled.button`
    position: absolute;
    right: 1px;
    bottom: 0;
    height: 34px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 36px;
    border: none;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border-left: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 0 ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;
