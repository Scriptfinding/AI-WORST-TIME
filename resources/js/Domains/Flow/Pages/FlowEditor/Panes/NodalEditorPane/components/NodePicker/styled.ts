import styled from 'styled-components';

export const NodePicker = styled.div`
    position: absolute;
    right: 16px;
    bottom: 72px;
    width: min(760px, calc(100vw - 32px));
    height: min(560px, calc(100vh - 150px));
    display: flex;
    flex-direction: column;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    overflow: hidden;
    z-index: 50;

    @media (max-width: 768px) {
        position: fixed;
        inset: 12px;
        z-index: 500;
        width: auto;
        height: auto;
        max-width: 100%;
        max-height: calc(100vh - 24px);
    }
`;

export const PickerHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 12px 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const PickerTitle = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;

    strong {
        font-size: 13px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    span {
        font-size: 11px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const ClosePicker = styled.button`
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const SearchWrap = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const SearchInput = styled.input`
    flex: 1;
    min-width: 0;
    border: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const PickerBody = styled.div`
    flex: 1;
    min-height: 0;
    display: grid;
    grid-template-columns: 190px 1fr;

    @media (max-width: 768px) {
        grid-template-columns: 1fr;
    }
`;

export const CategoryRail = styled.div`
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 2px;
    padding: 8px;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow: auto;

    @media (max-width: 768px) {
        flex-direction: row;
        align-items: center;
        border-right: none;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        overflow-x: auto;
        overflow-y: hidden;
    }
`;

export const CategoryPageButton = styled.button<{ $active?: boolean; $color?: string }>`
    display: flex;
    align-items: center;
    gap: 7px;
    flex: 0 0 auto;
    width: 100%;
    min-height: 36px;
    padding: 6px 8px;
    border-radius: ${({ theme }) => theme.radius.md};
    font-size: 12px;
    font-weight: 600;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
    color: ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.accent.primary) : theme.colors.text.secondary)};
    background: ${({ $active, $color, theme }) => ($active ? ($color || theme.colors.accent.primary) + '14' : 'transparent')};

    &:hover {
        color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
        background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}10;
    }

    @media (max-width: 768px) {
        width: auto;
        white-space: nowrap;
    }
`;

export const CategoryPageIcon = styled.span<{ $active?: boolean; $color?: string }>`
    width: 24px;
    height: 24px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
    flex-shrink: 0;

    ${({ $active, $color, theme }) => $active && `
        background: ${($color || theme.colors.accent.primary)}22;
    `}
`;

export const PickerContent = styled.div`
    flex: 1;
    overflow: auto;
    padding: 12px;
`;

export const NodeOptionRow = styled.div`
    position: relative;
    margin-bottom: 6px;
`;

export const NodeOption = styled.button<{
    $active?: boolean;
    $color?: string;
    $hasEditAction?: boolean;
    $hasDescription?: boolean;
}>`
    width: 100%;
    display: grid;
    grid-template-columns: 30px 1fr;
    align-items: ${({ $hasDescription }) => $hasDescription ? 'flex-start' : 'center'};
    gap: 9px;
    padding: 9px ${({ $hasEditAction }) => ($hasEditAction ? '42px' : '10px')} 9px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.border.focus) : 'transparent')};
    background: ${({ theme, $active }) => (
        $active
            ? theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.primary
            : 'transparent'
    )};
    text-align: left;
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme, $active, $color }) => ($active ? ($color || theme.colors.border.focus) : theme.colors.border.default)};
        background: ${({ theme }) => (
            theme.mode === 'dark' ? theme.colors.bg.tertiary : theme.colors.bg.primary
        )};
    }

    &:focus-visible {
        outline: 2px solid ${({ $color, theme }) => ($color || theme.colors.border.focus)}55;
        outline-offset: 1px;
    }

    ${({ $active, $color, theme }) => $active && `
        box-shadow: inset 3px 0 0 ${$color || theme.colors.border.focus};
    `}

    &:not(:hover):not(:focus-visible) {
        outline: none;
    }

    strong {
        font-size: 12px;
        color: ${({ theme }) => theme.colors.text.primary};
    }

    small {
        font-size: 10px;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    code {
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        font-family: ${({ theme }) => theme.font.mono};
        font-size: 10px;
        color: ${({ theme }) => theme.colors.accent.primary};
    }

    span {
        font-size: 11px;
        line-height: 1.4;
        color: ${({ theme }) => theme.colors.text.secondary};
    }
`;

export const NodeOptionEditLink = styled.a`
    position: absolute;
    top: 7px;
    right: 7px;
    z-index: 1;
    width: 26px;
    height: 26px;
    display: grid;
    place-items: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    opacity: 0.65;
    transition:
        color ${({ theme }) => theme.transition.fast},
        background ${({ theme }) => theme.transition.fast},
        opacity ${({ theme }) => theme.transition.fast};

    &:hover,
    &:focus-visible {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.primary};
        opacity: 1;
    }

    &:focus-visible {
        outline: 2px solid ${({ theme }) => theme.colors.border.focus}55;
        outline-offset: 1px;
    }
`;

export const NodeOptionIcon = styled.div<{ $color?: string }>`
    width: 28px;
    height: 28px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
`;

export const NodeOptionContent = styled.div`
    min-width: 0;
    display: flex;
    flex-direction: column;
    gap: 5px;
`;

export const NodeOptionTop = styled.div`
    width: 100%;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 10px;
`;

export const EmptySearch = styled.div`
    padding: 24px 12px;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
