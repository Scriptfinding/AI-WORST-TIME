import styled from 'styled-components';

export const TableUserCell = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 200px;
`;

export const TableMuted = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const MemberCount = styled(TableMuted)`
    margin-left: 8px;
`;

export const TableDateBadge = styled.span`
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

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const TableNumber = styled.span<{ $muted?: boolean }>`
    display: inline-block;
    min-width: 24px;
    text-align: center;
    padding: 1px 7px;
    border-radius: 999px;
    background: ${({ theme, $muted }) => $muted ? 'transparent' : theme.colors.bg.hover};
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 12px;
    color: ${({ theme, $muted }) => $muted ? theme.colors.text.tertiary : theme.colors.text.secondary};
`;

export const TeamIcon = styled.div`
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.hover};
    display: flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.secondary};
    flex-shrink: 0;
`;

export const TeamName = styled.div`
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const AvatarStack = styled.div`
    display: flex;
    align-items: center;
`;

export const Avatar = styled.div`
    display: inline-flex;
    border: 2px solid ${({ theme }) => theme.colors.bg.primary};
    border-radius: 50%;

    &:not(:first-child) {
        margin-left: -8px;
    }
`;

export const AvatarMore = styled.span`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    margin-left: -8px;
    border: 2px solid ${({ theme }) => theme.colors.bg.primary};
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.hover};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 10px;
    font-weight: 600;
`;
