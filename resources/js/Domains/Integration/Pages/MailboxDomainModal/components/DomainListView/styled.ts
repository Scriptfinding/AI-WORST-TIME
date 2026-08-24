import styled, { css, keyframes } from 'styled-components';

export const Hint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
    margin-top: -8px;
`;

export const NameRow = styled.div`
    margin-bottom: 20px;
    padding-bottom: 20px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const Form = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const DomainAddRow = styled.div`
    display: flex;
    gap: 8px;
    align-items: center;
`;

export const ErrorMessage = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.accent.error};
`;

export const DomainList = styled.div`
    display: flex;
    flex-direction: column;
    margin-top: 16px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    overflow: hidden;
`;

export const DomainRow = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    cursor: pointer;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    transition: background 100ms;

    &:last-child { border-bottom: none; }
    &:hover { background: ${({ theme }) => theme.colors.bg.secondary}; }
`;

export const DomainRowIcon = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
`;

export const DomainRowInfo = styled.div`
    flex: 1;
    min-width: 0;
`;

export const DomainRowName = styled.div`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const DomainRowMeta = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Badge = styled.span<{ $variant: 'success' | 'warning' }>`
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    ${({ $variant, theme }) => $variant === 'success'
        ? css`background: ${theme.colors.accent.successBg}; color: ${theme.colors.accent.success};`
        : css`background: ${theme.colors.accent.warningBg}; color: ${theme.colors.accent.warning};`}
`;

export const DomainRowDelete = styled.button`
    display: flex;
    align-items: center;
    padding: 4px;
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    border-radius: ${({ theme }) => theme.radius.sm};
    opacity: 0;
    transition: all 100ms;

    ${DomainRow}:hover & { opacity: 1; }
    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.errorBg};
    }
`;

export const DomainRowChevron = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
`;

export const EmptyHint = styled.div`
    padding: 32px 16px;
    text-align: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export const LoaderPane = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 40px 16px;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const Spinner = styled.div`
    width: 20px;
    height: 20px;
    border: 2px solid ${({ theme }) => theme.colors.border.default};
    border-top-color: ${({ theme }) => theme.colors.accent.primary};
    border-radius: 50%;
    animation: ${spin} 0.6s linear infinite;
`;

export const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;
