import styled from 'styled-components';

export const Body = styled.div`
    display: grid;
    gap: 18px;
`;

export const Notice = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 13px 14px;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.55;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.accent.primary};
    }

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
        word-break: break-word;
    }
`;

export const Form = styled.form`
    display: grid;
    gap: 12px;
`;

export const ErrorText = styled.p`
    margin: -6px 0 0;
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 12px;
    line-height: 1.45;
    text-align: center;
`;

export const TextButton = styled.button`
    width: fit-content;
    margin: 0 auto;
    padding: 0;
    border: 0;
    background: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    font-size: 12px;
    font-weight: 500;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.brand};
    }

    &:disabled {
        cursor: default;
        opacity: 0.55;
    }
`;
