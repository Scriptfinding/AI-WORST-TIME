import styled from 'styled-components';

export const FilterRow = styled.div`
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) repeat(3, minmax(0, 1fr));
    gap: 12px;
    width: 100%;

    @media (max-width: 1100px) {
        grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    @media (max-width: 640px) {
        grid-template-columns: 1fr;
    }
`;

export const Field = styled.label`
    display: flex;
    flex-direction: column;
    gap: 7px;
    min-width: 0;
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const SearchField = styled(Field)`
    grid-column: span 2;

    @media (max-width: 640px) {
        grid-column: span 1;
    }
`;

export const FilterBlock = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const FieldLabel = styled.span`
    font-size: 11px;
    font-weight: 700;
    text-transform: uppercase;
    letter-spacing: 0.04em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Input = styled.input`
    min-width: 0;
    height: 34px;
    padding: 0 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        opacity: 0.55;
        cursor: not-allowed;
    }
`;

export const StatusRow = styled.div`
    display: flex;
    flex-wrap: wrap;
    gap: 6px;
`;

export const StatusChip = styled.button<{ $active: boolean }>`
    padding: 5px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.border.default};
    background: ${({ theme, $active }) => $active ? theme.colors.accent.primary + '18' : theme.colors.bg.primary};
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;
