import styled from 'styled-components';

export const Section = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const Title = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
`;

export const ChipRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
`;

export const Chip = styled.button<{ $active: boolean }>`
    padding: 2px 8px;
    border: 1px solid ${({ theme, $active }) =>
        $active ? theme.colors.text.secondary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.bg.hover : 'transparent'};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.text.tertiary};
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;
