import styled from 'styled-components';

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

export const RunUserDropdown = styled.div`
    position: relative;
`;

export const RunUserDropdownTrigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    width: 100%;
    height: 34px;
    padding: 0 10px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.light};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme, $hasValue }) => $hasValue ? theme.colors.text.primary : theme.colors.text.secondary};
    font-size: 12px;
    transition: border-color ${({ theme }) => theme.transition.fast};

    span {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }
`;

export const RunUserDropdownPanel = styled.div`
    position: absolute;
    z-index: 80;
    top: calc(100% + 6px);
    left: 0;
    right: 0;
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.md};
`;

export const RunUserDropdownSearch = styled.input`
    width: 100%;
    height: 34px;
    padding: 0 10px;
    border: 0;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const RunUserDropdownList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
`;

export const RunUserDropdownItem = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    width: 100%;
    padding: 7px 8px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.hover : 'transparent'};
    color: ${({ theme, $active }) => $active ? theme.colors.text.primary : theme.colors.text.secondary};
    font-size: 12px;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const RunUserDropdownEmpty = styled.div`
    padding: 8px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
`;
