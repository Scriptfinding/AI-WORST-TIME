import styled from 'styled-components';

export const Row = styled.tr`
    td {
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const LibraryCell = styled.div`
    display: inline-flex;
    flex-direction: column;
    align-items: flex-start;
    gap: 3px;
    min-width: 170px;
    max-width: 240px;
`;

export const LibraryName = styled.div`
    display: inline-block;
    width: fit-content;
    max-width: 100%;
    min-width: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 500;
    font-family: ${({ theme }) => theme.font.mono};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    padding: 1px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const ErrorBox = styled.div`
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 8px 10px;
    font-size: 12px;
    line-height: 1.4;
`;

export const InlineCell = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    color: ${({ theme }) => theme.colors.text.primary};
    white-space: nowrap;
`;

export const RepoLink = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    max-width: 230px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    text-decoration: none;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.primary};
        text-decoration: underline;
    }
`;

export const ScopeBadge = styled.span<{ $scope: string }>`
    display: inline-flex;
    align-items: center;
    gap: 3px;
    font-size: 10px;
    font-weight: 500;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    white-space: nowrap;
    background: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f618' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') + '18' :
        '#eab30818'};
    color: ${({ $scope, theme }) =>
        $scope === 'workspace' ? '#3b82f6' :
        $scope === 'team' ? (theme.colors.accent.success || '#22c55e') :
        '#eab308'};
`;

export const OwnerName = styled.span`
    display: inline-flex;
    align-items: center;
    min-height: 24px;
    max-width: 120px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
`;

export const Number = styled.span`
    display: block;
    width: 100%;
    text-align: center;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const DateBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    white-space: nowrap;
`;
