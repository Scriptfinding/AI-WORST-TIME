import styled from 'styled-components';

export const Row = styled.div<{
    $array?: boolean;
    $hasRemove?: boolean;
    $hasDrag?: boolean;
    $dragging?: boolean;
    $dragOver?: boolean;
    $dropPosition?: 'before' | 'after';
}>`
    position: relative;
    display: grid;
    grid-template-columns: ${({ $array, $hasRemove, $hasDrag }) => {
        const columns = $array
            ? '28px 132px minmax(0, 1fr)'
            : 'minmax(90px, 0.8fr) 132px minmax(0, 1fr)';
        const draggableColumns = $hasDrag ? `14px ${columns}` : columns;
        return $hasRemove ? `${draggableColumns} 28px` : draggableColumns;
    }};
    gap: 8px;
    align-items: center;
    opacity: ${({ $dragging }) => $dragging ? 0.45 : 1};
    border-radius: 4px;

    &::after {
        content: '';
        position: absolute;
        z-index: 1;
        left: 0;
        right: 0;
        top: ${({ $dropPosition }) => $dropPosition === 'before' ? '-5px' : 'auto'};
        bottom: ${({ $dropPosition }) => $dropPosition === 'after' ? '-5px' : 'auto'};
        display: ${({ $dragOver }) => $dragOver ? 'block' : 'none'};
        height: 2px;
        border-radius: 2px;
        background: ${({ theme }) => theme.colors.text.tertiary};
        pointer-events: none;
    }

    @media (max-width: 520px) {
        grid-template-columns: ${({ $hasDrag }) => $hasDrag ? '14px minmax(0, 1fr)' : '1fr'};

        ${({ $hasDrag }) => $hasDrag && `
            > *:not(:first-child) {
                grid-column: 2;
            }
        `}
    }
`;

export const DragHandle = styled.button`
    width: 14px;
    height: 32px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: grab;
    opacity: 0.45;
    user-select: none;
    transition:
        color ${({ theme }) => theme.transition.fast},
        opacity ${({ theme }) => theme.transition.fast};

    &:hover {
        color: ${({ theme }) => theme.colors.text.secondary};
        opacity: 1;
    }

    &:active {
        cursor: grabbing;
    }
`;

export const ArrayIndex = styled.span`
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 32px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    font-variant-numeric: tabular-nums;
`;

export const Input = styled.input`
    min-width: 0;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.bg.primary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:disabled {
        cursor: not-allowed;
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.secondary};
        border-color: ${({ theme }) => theme.colors.border.light};
    }
`;

export const TypeSelectValue = styled.div`
    width: 100%;
    min-width: 0;

    > div > button {
        min-height: 34px;
        padding: 8px;
        font-weight: 400;
    }
`;

export const ValuePlaceholder = styled.div`
    min-height: 32px;
`;

export const BooleanValue = styled.div`
    min-height: 32px;
    display: flex;
    align-items: center;
    padding: 0 2px;
`;

export const ResourceValue = styled.div`
    width: 100%;
    min-width: 0;
    overflow: hidden;

    > div {
        width: 100%;
        min-width: 0;
    }

    > div > button {
        min-height: 34px;
        padding: 8px 10px;
        font-weight: 400;
        cursor: pointer;
    }

    > div > button:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    input {
        width: 100%;
        min-width: 0;
        box-sizing: border-box;
        padding: 8px 10px;
        border-radius: ${({ theme }) => theme.radius.md};
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        font-weight: 400;
        line-height: 1.2;
        background: ${({ theme }) => theme.colors.bg.primary};
        outline: none;
        cursor: pointer;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;

        &::placeholder {
            color: ${({ theme }) => theme.colors.text.tertiary};
            opacity: 1;
        }
    }

    input:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    input:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    input:disabled {
        cursor: not-allowed;
        color: ${({ theme }) => theme.colors.text.tertiary};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }
`;

export const NestedValueTrigger = styled.button<{ $open?: boolean; $empty?: boolean }>`
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    color: ${({ theme, $empty }) => $empty ? theme.colors.text.tertiary : theme.colors.text.primary};
    background: ${({ theme }) => theme.colors.bg.primary};
    font-size: 12px;
    text-align: left;
    cursor: pointer;
    overflow: hidden;

    > span:nth-child(2) {
        min-width: 0;
        flex: 1;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    svg {
        flex: 0 0 auto;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    > svg:last-child {
        transition: transform ${({ theme }) => theme.transition.fast};
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.55;
    }
`;

export const ValueIconSlot = styled.span`
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
        display: block;
    }
`;

export const RemoveButton = styled.button`
    width: 28px;
    height: 28px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 6px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    @media (max-width: 520px) {
        width: 100%;
        height: 34px;
        margin-bottom: 16px;
        border: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.primary};
    }
`;

export const RemoveButtonLabel = styled.span`
    display: none;

    @media (max-width: 520px) {
        display: inline;
        font-size: 12px;
        font-weight: 600;
    }
`;
