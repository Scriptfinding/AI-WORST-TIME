import styled from 'styled-components';

export const RecoveryToggle = styled.button`
    background: none;
    border: none;
    cursor: pointer;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
    padding: 0;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.brand};
    }
`;
