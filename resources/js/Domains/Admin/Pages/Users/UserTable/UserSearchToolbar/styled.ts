import styled from 'styled-components';

export const Toolbar = styled.div`
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const SearchWrapper = styled.div`
    position: relative;
    flex: 1;

    svg {
        position: absolute;
        left: 10px;
        top: 50%;
        transform: translateY(-50%);
        color: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
    }
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 12px 8px 34px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const CountBadge = styled.span`
    font-size: 11px;
    font-weight: 500;
    padding: 4px 10px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.tertiary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
`;

export const FilterResetBanner = styled.button`
    width: calc(100% - 32px);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    padding: 9px 12px;
    margin: 12px 16px;
    border: 1px solid ${({ theme }) => theme.colors.accent.primary}33;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.primary}10;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ theme }) => theme.colors.accent.primary}18;
        border-color: ${({ theme }) => theme.colors.accent.primary}66;
    }

    svg {
        flex-shrink: 0;
    }
`;
