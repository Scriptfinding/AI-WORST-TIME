import styled from 'styled-components';

export const Title = styled.div`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 6px;
`;

export const DisabledNotice = styled.div`
    display: flex;
    align-items: center;
    padding: 5px 7px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 10px;
    line-height: 1.3;
    gap: 5px;

    > svg {
        flex-shrink: 0;
    }
`;

export const PredicateGroup = styled.div`
    display: flex;
    gap: 4px;
`;

export const PredicateToggle = styled.button<{ $active: boolean }>`
    padding: 3px 8px;
    border: 1px solid ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary + '18' : 'transparent'};
    color: ${({ theme, $active }) =>
        $active ? theme.colors.accent.primary : theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.05em;
    text-transform: uppercase;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        opacity: 0.45;
        cursor: not-allowed;
    }
`;
