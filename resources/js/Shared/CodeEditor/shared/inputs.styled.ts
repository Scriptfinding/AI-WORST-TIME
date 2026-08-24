import styled from 'styled-components';

export const HelpSearchBar = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};

    > svg {
        width: 14px;
        height: 14px;
        flex-shrink: 0;
    }
`;

export const HelpSearchInput = styled.input`
    flex: 1;
    border: none;
    outline: none;
    background: transparent;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-family: ${({ theme }) => theme.font.mono};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const HelpSearchClear = styled.button`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: color ${({ theme }) => theme.transition.fast};

    svg {
        width: 12px;
        height: 12px;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
