import styled from 'styled-components';

export const GroupComboWrapper = styled.div`
    position: relative;
`;

export const GroupComboLabel = styled.label`
    display: block;
    margin-bottom: 4px;
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const GroupComboTrigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: 6px;
    color: ${({ theme, $hasValue }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    outline: none;
    cursor: pointer;
    text-align: left;
    &:focus { border-color: ${({ theme }) => theme.colors.border.focus}; }
    > svg:last-child {
        margin-left: auto;
        transition: transform 150ms ease;
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }
`;

export const GroupComboClear = styled.span`
    display: flex;
    align-items: center;
    margin-left: auto;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    &:hover { color: ${({ theme }) => theme.colors.text.primary}; }
`;

export const GroupComboPanel = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    z-index: 1100;
    overflow: hidden;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
`;

export const GroupComboSearch = styled.input`
    width: 100%;
    padding: 8px 12px;
    font-size: 13px;
    border: none;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;
    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
`;

export const GroupComboList = styled.ul`
    max-height: 180px;
    overflow-y: auto;
    list-style: none;
    margin: 0;
    padding: 4px 0;
`;

export const GroupComboItem = styled.li<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 12px;
    font-size: 13px;
    cursor: pointer;
    color: ${({ theme }) => theme.colors.text.primary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.tertiary : 'transparent'};
    &:hover { background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;

export const GroupComboEmpty = styled.li`
    padding: 8px 12px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const GroupComboCreate = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    background: none;
    border: none;
    color: ${({ theme }) => theme.colors.accent.primary};
    cursor: pointer;
    &:hover { background: ${({ theme }) => theme.colors.bg.tertiary}; }
`;
