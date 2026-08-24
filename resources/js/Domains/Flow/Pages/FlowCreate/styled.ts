import styled, { css } from 'styled-components';

export const Container = styled.div`
    max-width: 1100px;
`;

export const TwoColumns = styled.form`
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 32px;
    align-items: start;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const Column = styled.div`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const ColumnHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 4px;
`;

export const ColumnIcon = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}15;
    color: ${({ theme }) => theme.colors.accent.primary};
    flex-shrink: 0;
`;

export const ColumnTitle = styled.h2`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ColumnDesc = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.5;
    margin-bottom: 4px;
`;

export const ColumnLabel = styled.label`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const SourceToggle = styled.div`
    display: flex;
    gap: 4px;
    padding: 3px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const SourceOption = styled.button<{ $active?: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: none;
    cursor: pointer;
    transition: all 150ms;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
        filter: grayscale(1);
    }

    ${({ $active, theme }) => $active
        ? css`
            background: ${theme.colors.accent.primary};
            color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `
        : css`
            background: transparent;
            color: ${theme.colors.text.secondary};

            &:hover:not(:disabled) {
                background: ${theme.colors.bg.hover};
            }
        `
    }
`;

export const SourceHint = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 10px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.5;

    svg {
        flex-shrink: 0;
        margin-top: 1px;
    }
`;

export const SourceFeatures = styled.div`
    display: flex;
    flex-direction: column;
    gap: 10px;
    margin-top: 4px;
`;

export const SourceFeature = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 8px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.4;

    svg {
        flex-shrink: 0;
        margin-top: 2px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Actions = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 8px;
    grid-column: 1 / -1;
`;
