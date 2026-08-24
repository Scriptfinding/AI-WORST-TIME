import styled from 'styled-components';

export const FolderIcon = styled.div<{ $team?: boolean; $shared?: boolean }>`
    position: relative;
    color: ${({ theme, $team, $shared }) => $team ? theme.colors.accent.success : $shared ? theme.colors.accent.info : theme.colors.accent.warning};
    flex-shrink: 0;
    display: flex;

    svg {
        width: 18px;
        height: 18px;
    }
`;

export const SharedBadge = styled.div`
    position: absolute;
    bottom: -3px;
    right: -5px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.accent.info};

    svg {
        width: 10px;
        height: 10px;
    }
`;

export const TeamBadge = styled(SharedBadge)`
    color: ${({ theme }) => theme.colors.accent.success};
`;
