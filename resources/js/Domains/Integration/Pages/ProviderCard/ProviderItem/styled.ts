import styled, { keyframes, type DefaultTheme } from 'styled-components';

export const ItemWrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const Item = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    font-size: 13px;
`;

export const ItemLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    min-width: 0;
`;

export const ItemName = styled.span`
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

const scopeColor = (scope: string | undefined, theme: DefaultTheme) => {
    if (scope === 'team') return theme.colors.accent.success;
    if (scope === 'workspace') return theme.colors.accent.info;
    return '#e5a00d';
};

export const ScopeBadge = styled.span<{ $scope?: string }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    height: 20px;
    padding: 0 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $scope, theme }) => scopeColor($scope, theme)}12;
    color: ${({ $scope, theme }) => scopeColor($scope, theme)};
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
`;

export const ReadonlyBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
    height: 20px;
    padding: 0 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.text.tertiary}12;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
`;

export const MemberOwner = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    flex-shrink: 0;
`;

export const ItemActions = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export const IconButton = styled.button<{ $variant?: 'danger' | 'default' }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 28px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme, $variant }) => $variant === 'danger' ? theme.colors.accent.error : theme.colors.text.tertiary};
    cursor: pointer;

    &:hover:not(:disabled) {
        background: ${({ theme, $variant }) => $variant === 'danger' ? theme.colors.accent.error + '18' : theme.colors.bg.hover};
    }

    &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
    }

    .spin {
        animation: ${spin} 800ms linear infinite;
    }
`;
