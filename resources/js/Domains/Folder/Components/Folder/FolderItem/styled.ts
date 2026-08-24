import styled, { css } from 'styled-components';

export const Item = styled.a<{ $dragOver?: boolean; $selected?: boolean; $selectionActive?: boolean }>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 14px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    cursor: pointer;
    text-decoration: none;
    color: inherit;
    transition: all ${({ theme }) => theme.transition.fast};
    box-shadow: ${({ theme, $selected }) => $selected ? `0 0 0 3px ${theme.colors.accent.primary}18` : 'none'};

    &:hover {
        border-color: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }

    &:hover [data-select-checkbox] {
        opacity: 1;
        transform: translate(-50%, -50%) scale(1);
    }

    &:hover [data-select-icon] {
        opacity: 0;
        transform: scale(0.72);
    }

    &:hover [data-folder-item-menu] {
        opacity: 1;
    }

    ${({ $selected, $selectionActive }) => ($selected || $selectionActive) && css`
        [data-select-checkbox] {
            opacity: 1;
            transform: translate(-50%, -50%) scale(1);
        }

        [data-select-icon] {
            opacity: 0;
            transform: scale(0.72);
        }
    `}

    &[draggable='true'] {
        cursor: grab;

        &:active {
            cursor: grabbing;
            opacity: 0.6;
        }
    }

    ${({ $dragOver, theme }) =>
        $dragOver &&
        css`
            border-color: ${theme.colors.accent.primary};
            background: ${theme.colors.accent.primary}18;
            box-shadow: 0 0 0 2px ${theme.colors.accent.primary}40;
        `}
`;

export const SelectableIconWrapper = styled.span`
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
`;

export const SelectableFolderIcon = styled.span.attrs<{ 'data-select-icon'?: string }>({ 'data-select-icon': '' })<{ $selected?: boolean }>`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    opacity: ${({ $selected }) => $selected ? 0 : 1};
    transform: ${({ $selected }) => $selected ? 'scale(0.72)' : 'scale(1)'};
    transition: opacity 140ms ease, transform 140ms ease;
`;

export const SelectCheckbox = styled.button.attrs<{ 'data-select-checkbox'?: string }>({ 'data-select-checkbox': '' })<{ $selected?: boolean }>`
    position: absolute;
    inset: 50% auto auto 50%;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    padding: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.border.light};
    background: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.bg.secondary};
    color: white;
    box-shadow: ${({ theme }) => theme.shadow.md};
    cursor: pointer;
    opacity: ${({ $selected }) => $selected ? 1 : 0};
    transform: translate(-50%, -50%) scale(${({ $selected }) => $selected ? 1 : 0.82});
    transition: opacity 140ms ease, transform 140ms ease, border-color ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
        background: ${({ theme, $selected }) => $selected ? theme.colors.accent.primary : theme.colors.bg.tertiary};
    }
`;

export const NameGroup = styled.div`
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
`;

export const Name = styled.span`
    font-size: 13px;
    font-weight: 500;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const OwnerName = styled.span`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;


