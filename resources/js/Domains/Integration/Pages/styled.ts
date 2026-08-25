import styled, { keyframes } from 'styled-components';

export const Page = styled.div`
    display: flex;
    flex-direction: column;
    gap: 32px;
    padding-bottom: 60px;
`;

// Repo browser (used by repo link modals)

export const RepoList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    max-height: 350px;
    overflow-y: auto;
`;

export const RepoItem = styled.div<{ $added?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme, $added }) => $added ? theme.colors.accent.primary + '08' : theme.colors.bg.primary};
    transition: background 150ms;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const RepoItemInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const RepoItemName = styled.span`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RepoItemFullName = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const LockIcon = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-left: 4px;
`;

export const SearchWrapper = styled.div`
    position: relative;
    margin-bottom: 8px;

    svg {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
    }
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 10px 8px 32px;
    font-size: 13px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

const spin = keyframes`
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
`;

export const LoadingCenter = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    gap: 8px;
    font-size: 13px;

    svg {
        animation: ${spin} 1s linear infinite;
    }
`;

export const EmptyMessage = styled.div`
    text-align: center;
    padding: 20px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

// Managed repos

export const ManagedRepoList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const ManagedRepoItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const ManagedRepoInfo = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const ManagedRepoName = styled.a`
    font-size: 13px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.primary};
    text-decoration: none;
    display: flex;
    align-items: center;
    gap: 4px;

    &:hover {
        text-decoration: underline;
    }
`;

export const ManagedRepoMeta = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const TabBar = styled.div`
    display: flex;
    gap: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    margin-bottom: 12px;
`;

export const Tab = styled.button<{ $active?: boolean }>`
    padding: 8px 16px;
    font-size: 13px;
    font-weight: ${({ $active }) => $active ? 600 : 400};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    background: none;
    border: none;
    border-bottom: 2px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : 'transparent'};
    cursor: pointer;
    transition: color 150ms, border-color 150ms;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
