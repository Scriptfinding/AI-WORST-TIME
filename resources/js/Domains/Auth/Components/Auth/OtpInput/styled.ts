import styled from 'styled-components';

export const Group = styled.div`
    display: grid;
    grid-template-columns: repeat(6, minmax(0, 1fr));
    gap: 8px;
`;

export const Input = styled.input`
    width: 100%;
    min-width: 0;
    height: 48px;
    padding: 0;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 20px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    text-align: center;
    transition:
        border-color ${({ theme }) => theme.transition.fast},
        box-shadow ${({ theme }) => theme.transition.fast};

    &:focus {
        border-color: ${({ theme }) => theme.colors.brand};
        box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.brand}22;
    }
`;
