import styled, { css, type DefaultTheme } from 'styled-components';
import type { FlowCardVariant } from '@/Domains/Flow/Components/Flow/FlowCard/types';

export const Header = styled.div<{ $variant: FlowCardVariant }>`
    display: flex;
    flex-direction: row;
    align-items: ${({ $variant }) => $variant === 'list' ? 'center' : 'flex-start'};
    gap: 8px;
    align-self: stretch;
    flex: ${({ $variant }) => $variant === 'list' ? '1' : '0 0 auto'};
    min-width: 0;
    flex-wrap: wrap;
`;

export const Left = styled.div`
    display: flex;
    flex: 1;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const Right = styled.div<{ $variant: FlowCardVariant }>`
    display: flex;
    flex-direction: row;
    align-items: center;
    gap: ${({ $variant }) => $variant === 'list' ? '12px' : '4px'};
    flex-shrink: 0;
    flex-wrap: wrap;
    max-width: 100%;
`;

export const Name = styled.h3<{ $variant: FlowCardVariant }>`
    font-size: 14px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};

    ${({ $variant }) => $variant === 'list'
        ? css`
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
        `
        : css`
            display: -webkit-box;
            -webkit-line-clamp: 2;
            -webkit-box-orient: vertical;
            overflow: hidden;
        `}
`;

const visibilityColors: Record<'owner' | 'team' | 'workspace', (theme: DefaultTheme) => string> = {
    owner: theme => theme.colors.accent.warning,
    team: theme => theme.colors.accent.success,
    workspace: theme => theme.colors.accent.info,
};

export const VisibilityTag = styled.span<{ $visibility: 'owner' | 'workspace' | 'team' }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 2px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.02em;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme, $visibility }) => visibilityColors[$visibility](theme)};
    background: ${({ theme, $visibility }) => visibilityColors[$visibility](theme) + '12'};
    border: 1px solid ${({ theme, $visibility }) => visibilityColors[$visibility](theme) + '30'};
    white-space: nowrap;

    svg {
        flex-shrink: 0;
    }
`;

export const ImportedTag = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    font-size: 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};

    svg {
        width: 1em;
        height: 1em;
        flex-shrink: 0;
    }
`;
