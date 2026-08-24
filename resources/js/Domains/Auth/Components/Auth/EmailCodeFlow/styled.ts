import styled from 'styled-components';

export const CodeStage = styled.div`
    display: grid;
    gap: 18px;
`;

export const CodeHint = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    line-height: 1.6;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
        font-weight: 600;
        word-break: break-word;
    }
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
