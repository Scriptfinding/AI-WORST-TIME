import styled from 'styled-components';

export const ConfirmHint = styled.p`
    margin-bottom: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.5;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
    }
`;

export const ConfirmInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.error};
    }
`;
