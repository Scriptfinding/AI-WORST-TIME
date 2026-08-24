import styled from 'styled-components';

export const FlowRow = styled.tr`
    td {
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const FlowNameCell = styled.div`
    display: flex;
    min-width: 0;
    width: 100%;
`;

export const FlowName = styled.div`
    display: block;
    min-width: 0;
    width: 100%;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 600;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ScopeBadge = styled.span<{ $scope: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f618' :
        $scope === 'team' ? `${theme.colors.accent.success || '#22c55e'}18` :
        '#eab30818'};
    color: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f6' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') :
        '#eab308'};
    font-size: 10px;
    font-weight: 500;
    white-space: nowrap;
`;

export const OwnerName = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const TableActions = styled.div`
    display: flex;
    position: relative;
    align-items: center;
    justify-content: flex-end;
    gap: 6px;
`;

export const IconLinkButton = styled.a`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    min-height: 30px;
    padding: 0 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    text-decoration: none;
    transition: background ${({ theme }) => theme.transition.fast}, color ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
