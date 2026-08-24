import styled from 'styled-components';

export const Button = styled.button`
    position: absolute;
    top: 8px;
    right: 8px;
    padding: 4px 10px;
    font-size: 11px;
    font-weight: 500;
    color: #9ca3af;
    background: transparent;
    border: 1px solid #4b5563;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        color: #e5e7eb;
        background: #374151;
    }
`;
