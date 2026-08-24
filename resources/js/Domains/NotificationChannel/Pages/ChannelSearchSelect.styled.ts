import styled from 'styled-components';

export const SearchSelect = styled.div`
    position: relative;
    width: 100%;
`;

export const SearchSelectTrigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    width: 100%;
    padding: 8px 12px;
    padding-right: 32px;
    font-size: 13px;
    text-align: left;
    border: 1px solid ${({ $open, theme }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    outline: none;
    transition: border-color 150ms;
    position: relative;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const SearchSelectArrow = styled.span<{ $open?: boolean }>`
    position: absolute;
    right: 10px;
    top: 50%;
    transform: translateY(-50%) rotate(${({ $open }) => $open ? '180deg' : '0deg'});
    transition: transform 150ms;
    color: ${({ theme }) => theme.colors.text.tertiary};
    display: flex;
    align-items: center;
    pointer-events: none;
`;

export const SearchSelectDropdown = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1100;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    overflow: hidden;
`;

export const SearchSelectInput = styled.input`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SearchSelectList = styled.div`
    max-height: 200px;
    overflow-y: auto;
`;

export const SearchSelectOption = styled.button<{ $selected?: boolean }>`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    text-align: left;
    border: none;
    cursor: pointer;
    display: flex;
    align-items: center;
    gap: 8px;
    transition: background 100ms;
    background: ${({ $selected, theme }) => $selected ? theme.colors.accent.primary + '12' : 'transparent'};
    color: ${({ $selected, theme }) => $selected ? theme.colors.accent.primary : theme.colors.text.primary};
    font-weight: ${({ $selected }) => $selected ? 600 : 400};

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const SearchSelectEmpty = styled.div`
    padding: 16px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
