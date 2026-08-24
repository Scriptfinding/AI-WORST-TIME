import styled from 'styled-components';

export const Categories = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
`;

export const CategoryButton = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 9px 10px;
    border: 1px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary + '55' : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '12' : theme.colors.bg.secondary};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    cursor: pointer;
    text-align: left;
`;
