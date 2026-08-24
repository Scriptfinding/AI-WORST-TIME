import styled from 'styled-components';

export const Wrapper = styled.div`
    position: relative;
    min-width: 0;
    flex-shrink: 0;
    max-width: 60%;
`;

export const Button = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-weight: 600;
    max-width: 100%;
    font-size: 14px;
    white-space: nowrap;
    overflow: hidden;
    cursor: pointer;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    transition: background ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    @media (max-width: 768px) {
        font-size: 13px;
    }

    svg {
        width: 12px;
        height: 12px;
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Name = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
`;

