import styled from 'styled-components';

export const UserCell = styled.div`
    display: flex;
    align-items: center;
    gap: 10px;
    min-width: 200px;
`;

export const UserInfo = styled.div`
    min-width: 0;
`;

export const MemberName = styled.div`
    font-size: 13px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const TeamBadges = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 3px;
    min-width: 0;
`;

export const TeamBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 7px;
    font-size: 10px;
    font-weight: 500;
    border-radius: 99px;
    background: ${({ theme }) => theme.colors.bg.hover};
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Muted = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;

export const Number = styled.span<{ $muted?: boolean }>`
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

export const InstanceAdminPill = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 1px 7px;
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}40;
    background: ${({ theme }) => theme.colors.accent.warningBg};
    color: ${({ theme }) => theme.colors.accent.warning};
    font-size: 10px;
    font-weight: 600;
    white-space: nowrap;

    svg {
        flex-shrink: 0;
    }
`;
