import styled, { css } from 'styled-components';

export const InfoGrid = styled.div`
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding: 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border-radius: ${({ theme }) => theme.radius.md};
    margin-bottom: 20px;
`;

export const InfoCell = styled.div``;

export const InfoCellLabel = styled.dt`
    font-size: 10px;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-bottom: 3px;
`;

export const InfoCellValue = styled.dd`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
`;

export const Badge = styled.span<{ $variant: 'success' | 'warning' | 'default' }>`
    display: inline-flex;
    align-items: center;
    font-size: 10px;
    font-weight: 500;
    padding: 1px 7px;
    border-radius: ${({ theme }) => theme.radius.full};
    ${({ $variant, theme }) => {
        if ($variant === 'success') {
            return css`background: ${theme.colors.accent.successBg}; color: ${theme.colors.accent.success};`;
        }
        if ($variant === 'warning') {
            return css`background: ${theme.colors.accent.warningBg}; color: ${theme.colors.accent.warning};`;
        }
        return css`background: ${theme.colors.accent.defaultBg}; color: ${theme.colors.accent.default};`;
    }}
`;

export const SectionTitle = styled.h3`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0 0 6px;
`;

export const SectionDescription = styled.p`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0 0 12px;
    line-height: 1.4;
`;

export const TabBar = styled.div`
    display: flex;
    gap: 2px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    margin-bottom: 12px;
`;

export const TabButton = styled.button<{ $active?: boolean }>`
    padding: 6px 12px;
    font-size: 12px;
    font-weight: 500;
    background: none;
    border: none;
    border-bottom: 2px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    cursor: pointer;
    margin-bottom: -1px;
    transition: color 100ms;

    &:hover { color: ${({ theme }) => theme.colors.accent.primary}; }
`;

export const ZoneBlock = styled.div`
    position: relative;
    background: ${({ theme }) => theme.mode === 'dark' ? '#1a1a2e' : '#1f2937'};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 14px;
    margin-bottom: 8px;
`;

export const ZoneCode = styled.pre`
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    color: #e5e7eb;
    margin: 0;
    white-space: pre-wrap;
    word-break: break-all;
    line-height: 1.6;
`;

export const ZoneCopyButton = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 3px 8px;
    font-size: 10px;
    font-weight: 500;
    color: #9ca3af;
    background: transparent;
    border: 1px solid #4b5563;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    transition: all 100ms;

    &:hover { color: #e5e7eb; background: #374151; }
`;

export const VerificationSection = styled.div`
    margin-top: 16px;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Footer = styled.div`
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-top: 20px;
    margin-bottom: 16px;
    padding-top: 16px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const BackLink = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: none;
    border: none;
    padding: 0;
    cursor: pointer;
    transition: color 100ms;

    &:hover { color: ${({ theme }) => theme.colors.text.secondary}; }
`;
