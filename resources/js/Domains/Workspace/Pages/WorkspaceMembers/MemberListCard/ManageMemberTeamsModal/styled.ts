import styled from 'styled-components';

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    margin-bottom: 8px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const TeamList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 240px;
    overflow-y: auto;
`;

export const TeamItem = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 10px;
    min-width: 0;
    font-size: 13px;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    text-align: left;
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const TeamName = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const TeamMeta = styled.span`
    flex-shrink: 0;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const EmptyState = styled.div`
    padding: 24px 0;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const CurrentTeams = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    margin-top: 12px;
    min-width: 0;
    padding-top: 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const CurrentTeamsLabel = styled.div`
    margin-bottom: 4px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const CurrentTeam = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    min-width: 0;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const RemoveButton = styled.button`
    display: inline-flex;
    align-items: center;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.accent.errorBg};
    }
`;
