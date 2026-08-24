import styled from 'styled-components';

export const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    position: relative;
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Trigger = styled.button`
    width: 100%;
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    text-align: left;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.border.focus};
    }
`;

export const Chevron = styled.span<{ $open: boolean }>`
    font-size: 16px;
    line-height: 1;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: transform ${({ theme }) => theme.transition.fast};
    transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'rotate(0)'};
`;

export const Dropdown = styled.div`
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    z-index: 50;
    margin-top: 4px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
    overflow: hidden;
`;

export const SearchInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        outline: none;
    }
`;

export const List = styled.div`
    max-height: 200px;
    overflow-y: auto;
`;

export const Item = styled.div<{ $active: boolean }>`
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
    color: ${({ theme, $active }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.hover : 'transparent'};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const Empty = styled.div`
    padding: 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const ErrorText = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.accent.error};
`;
