import styled, { css } from 'styled-components';
import { Link } from '@inertiajs/react';

export const SourceBadge = styled.span<{ $repo?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 3px 8px;
    font-size: 11px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $repo }) => $repo ? theme.colors.accent.primary + '15' : theme.colors.bg.hover};
    color: ${({ theme, $repo }) => $repo ? theme.colors.accent.primary : theme.colors.text.tertiary};
`;

export const EmptyCopy = styled.div`
    display: flex;
    flex-direction: column;
    gap: 12px;
`;

export const InlineLink = styled(Link)`
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    text-decoration: none;

    &:hover {
        text-decoration: underline;
    }
`;

export const EmptyState = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    padding: 32px 16px;
    text-align: center;
`;

export const EmptyIcon = styled.div`
    width: 40px;
    height: 40px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.bg.hover};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const EmptyTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const EmptyDesc = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.5;
`;

export const LinkedBanner = styled.div<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    margin-top: 10px;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '08' : theme.colors.bg.primary};
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary + '40' : theme.colors.border.default};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
    line-height: 1.5;
`;

export const LinkedBannerIcon = styled.span`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.accent.primary};
    flex-shrink: 0;
`;

export const FieldGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const FieldLabel = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const FieldHint = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
`;

export const SyncToggle = styled.div`
    display: flex;
    gap: 4px;
    padding: 3px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const SyncOption = styled.button<{ $active?: boolean }>`
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 7px 10px;
    font-size: 12px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: none;
    cursor: pointer;
    transition: all 150ms;

    ${({ $active, theme }) => $active
        ? css`
            background: ${theme.colors.accent.primary};
            color: white;
            box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        `
        : css`
            background: transparent;
            color: ${theme.colors.text.secondary};

            &:hover {
                background: ${theme.colors.bg.hover};
            }
        `
    }
`;

export const FormActions = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding-top: 8px;
    justify-content: flex-end;
`;

export const ExternalLink = styled.a`
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    padding: 8px 12px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    text-decoration: none;
    transition: all 150ms;

    &:hover {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
