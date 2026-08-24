import styled from 'styled-components';

export const ViewToggleRow = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 2px;
    flex-shrink: 0;
`;

export const ViewToggleButton = styled.button<{ $active: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 28px;
    height: 26px;
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '14' : 'transparent'};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const ArtifactSection = styled.div`
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    padding: 12px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    flex: 1;
    min-height: 0;
    overflow: auto;
`;

export const ArtifactSectionHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
