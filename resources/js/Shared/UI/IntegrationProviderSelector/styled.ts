import styled from 'styled-components';

export const Label = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Pills = styled.div`
    display: flex;
    gap: 8px;
    margin-top: 4px;
    flex-wrap: wrap;
`;

export const Pill = styled.button<{ $active?: boolean; $color?: string }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    font-size: 13px;
    font-weight: 500;
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    transition: all 150ms;
    border: 1.5px solid ${({ $active, $color, theme }) =>
        $active ? ($color || theme.colors.accent.primary) : theme.colors.border.default};
    background: ${({ $active, $color }) =>
        $active ? ($color || '#888') + '14' : 'transparent'};
    color: ${({ $active, $color, theme }) =>
        $active ? ($color || theme.colors.accent.primary) : theme.colors.text.secondary};

    &:hover {
        border-color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
        background: ${({ $color }) => ($color || '#888') + '0a'};
    }
`;

export const EmptyResult = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 8px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.warning}20;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.accent.warningBg};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const EmptyResultContent = styled.div`
    flex: 1;
    display: flex;
    align-items: center;
    gap: 6px;
    line-height: 1.45;
`;
