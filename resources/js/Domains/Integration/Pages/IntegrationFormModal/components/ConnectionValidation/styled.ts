import styled, { css } from 'styled-components';

export const Validation = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
`;

export const Action = styled.div`
    display: flex;
`;

export const Status = styled.div<{ $valid: boolean }>`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    line-height: 1.4;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};

    ${({ $valid, theme }) => $valid
        ? css`
            background: #22c55e0c;
            border: 1px solid #22c55e30;
            color: #22c55e;
        `
        : css`
            background: ${theme.colors.accent.error}0a;
            border: 1px solid ${theme.colors.accent.error}25;
            color: ${theme.colors.accent.error};
        `
    }

    svg {
        flex-shrink: 0;
        margin-top: 1px;
    }
`;
