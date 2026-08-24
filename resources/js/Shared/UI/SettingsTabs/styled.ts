import styled from 'styled-components';

export const SettingsTabsScroller = styled.div`
    flex: 0 0 auto;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin-bottom: 24px;
    border-bottom: 1px solid var(--pf-border-default);
    overflow-x: auto;
    overflow-y: clip;
    -webkit-overflow-scrolling: touch;
`;

export const SettingsTabs = styled.div`
    display: inline-flex;
    min-width: max-content;
    gap: 2px;
`;

export const SettingsTab = styled.button<{ $active?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    flex-shrink: 0;
    padding: 10px 16px;
    font-size: 13px;
    font-weight: ${({ $active }) => $active ? 600 : 500};
    white-space: nowrap;
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    border-bottom: 2px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : 'transparent'};
    margin-bottom: -1px;
    transition: color ${({ theme }) => theme.transition.fast}, border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    }
`;
