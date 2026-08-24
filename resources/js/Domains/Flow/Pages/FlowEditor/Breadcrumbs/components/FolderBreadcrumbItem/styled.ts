import styled from 'styled-components';

export const Item = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    flex-shrink: 10;
    transition: color ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    @media (max-width: 768px) {
        &:not(:first-child) {
            display: none;
        }
    }
`;

export const Wrapper = styled.div`
    position: relative;
    min-width: 0;
    flex-shrink: 10;
`;

export const Button = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-weight: 400;
    cursor: pointer;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: inherit;
    padding: 2px 4px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    @media (max-width: 768px) {
        display: none;
    }

    svg:last-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        opacity: 0.6;
    }
`;
