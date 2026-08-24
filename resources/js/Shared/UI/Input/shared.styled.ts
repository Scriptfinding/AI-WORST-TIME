import styled, { css } from 'styled-components';

export const controlStyles = css<{ $hasError?: boolean }>`
    width: 100%;
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme, $hasError }) =>
        $hasError ? theme.colors.accent.error : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
`;

export const Wrapper = styled.div<{ $fullWidth?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 6px;
    ${({ $fullWidth }) => $fullWidth && css`width: 100%;`}
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Error = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
`;
