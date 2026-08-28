import styled, { css, keyframes } from 'styled-components';
import LocalTableFilterToolbar from '@/Shared/UI/TableFilters/LocalTableFilterToolbar';

export const PanelFilterToolbar = styled(LocalTableFilterToolbar)`
    flex-shrink: 0;
    margin-top: 0;
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Page = styled.div`
    display: flex;
    min-height: 0;
    flex: 1;
    flex-direction: column;
`;

export const Container = styled.div`
    display: flex;
    flex: 1;
    min-width: 0;
    overflow: hidden;
`;

export const Panel = styled.section<{ $width: string; $mobileVisible?: boolean }>`
    display: flex;
    flex: 0 0 ${({ $width }) => $width};
    min-width: 220px;
    flex-direction: column;
    overflow: hidden;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};

    @media (max-width: 900px) {
        flex-basis: 260px;
    }

    @media (max-width: 768px) {
        display: ${({ $mobileVisible }) => $mobileVisible ? 'flex' : 'none'};
        min-width: 100%;
        flex-basis: 100%;
    }
`;

export const GridPanel = styled.section<{ $mobileVisible?: boolean }>`
    display: flex;
    flex: 1;
    min-width: 0;
    flex-direction: column;
    overflow: hidden;

    @media (max-width: 768px) {
        display: ${({ $mobileVisible }) => $mobileVisible === false ? 'none' : 'flex'};
        min-width: 100%;
    }
`;

export const MobileNav = styled.nav`
    display: none;

    @media (max-width: 768px) {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        padding: 6px;
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        gap: 4px;
    }
`;

export const MobileNavButton = styled.button<{ $active: boolean }>`
    padding: 7px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.bg.hover : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.text.primary : theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 600;
`;

export const PanelHeader = styled.header`
    display: flex;
    min-height: 46px;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 0 14px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const PanelContextTitle = styled.span`
    min-width: 0;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const PanelContextCount = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;

export const PanelTitleWrap = styled.div`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 7px;
`;

export const PanelTitle = styled.h2`
    overflow: hidden;
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
    font-weight: 600;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Count = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
`;

export const IconButton = styled.button<{ $danger?: boolean; $active?: boolean }>`
    display: inline-flex;
    width: 26px;
    height: 26px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid ${({ $active, theme }) => $active ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? `${theme.colors.accent.primary}15` : theme.colors.bg.secondary};
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.secondary};
    cursor: pointer;

    &:hover:not(:disabled) {
        border-color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.border.focus};
        color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.45;
    }
`;

export const HeaderActions = styled.div`
    display: flex;
    align-items: center;
    gap: 6px;
`;

export const List = styled.div`
    flex: 1;
    overflow-y: auto;
`;

const listRow = css<{ $active: boolean; $depth?: number }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    padding: 9px 11px;
    padding-left: ${({ $depth = 0 }) => `${11 + $depth * 14}px`};
    border: 0;
    border-left: 3px solid ${({ $active, theme }) => $active ? theme.colors.accent.primary : 'transparent'};
    background: ${({ $active, theme }) => $active ? theme.colors.bg.hover : 'transparent'};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    text-align: left;

    &:hover { background: ${({ theme }) => theme.colors.bg.secondary}; }
`;

export const ListRow = styled.button<{ $active: boolean }>`
    ${listRow}
`;

export const TableListRow = styled.div<{ $active: boolean; $depth?: number }>`
    ${listRow}
`;

export const FolderLabel = styled.button<{ $depth: number }>`
    position: sticky;
    top: 0;
    z-index: 1;
    display: flex;
    width: 100%;
    align-items: center;
    gap: 4px;
    padding: 6px 14px;
    padding-left: ${({ $depth }) => `${14 + $depth * 14}px`};
    border: none;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 0.06em;
    text-align: left;
    text-transform: uppercase;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.secondary};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GroupCount = styled.span`
    margin-left: auto;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    opacity: 0.8;
`;

export const ScopeIcon = styled.span<{ $scope: string }>`
    display: inline-flex;
    width: 22px;
    height: 22px;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    border: 1.5px solid ${({ $scope, theme }) => $scope === 'workspace'
        ? `${theme.colors.accent.info}40`
        : $scope === 'team' ? `${theme.colors.accent.success}40` : '#eab30840'};
    border-radius: 5px;
    background: ${({ $scope, theme }) => $scope === 'workspace'
        ? `${theme.colors.accent.info}18`
        : $scope === 'team' ? `${theme.colors.accent.success}18` : '#eab30818'};
    color: ${({ $scope, theme }) => $scope === 'workspace'
        ? theme.colors.accent.info
        : $scope === 'team' ? theme.colors.accent.success : '#ca8a04'};
`;

export const RowContent = styled.span`
    display: flex;
    min-width: 0;
    flex: 1;
    flex-direction: column;
    gap: 2px;
`;

export const RowName = styled.span`
    overflow: hidden;
    font-size: 12px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RowMeta = styled.span`
    overflow: hidden;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const RowActions = styled.span`
    display: none;
    flex-shrink: 0;
    align-items: center;
    gap: 2px;
    margin-left: 6px;
    ${ListRow}:hover &,
    ${TableListRow}:hover & {
        display: flex;
    }
`;

export const BareAction = styled.button<{ $danger?: boolean }>`
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding: 2px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.xs};
    background: transparent;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    &:hover {
        background: ${({ $danger, theme }) => (
        $danger ? theme.colors.accent.errorBg : `${theme.colors.accent.primary}15`
    )};
        color: ${({ $danger, theme }) => (
        $danger ? theme.colors.accent.error : theme.colors.accent.primary
    )};
    }
`;

export const EmptyState = styled.div`
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    padding: 24px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 12px;
    line-height: 1.5;
    text-align: center;
    white-space: pre-line;
`;

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const GridToolbar = styled.div`
    display: flex;
    min-height: 46px;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 0 12px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const ToolbarGroup = styled.div`
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 6px;
`;

export const RefreshButton = styled(IconButton)<{ $loading?: boolean }>`
    flex: 0 0 auto;

    ${({ $loading }) => $loading && css`
        svg {
            animation: ${spin} 0.7s linear infinite;
        }
    `}
`;

export const GridScroller = styled.div`
    position: relative;
    flex: 1;
    overflow: auto;
    background: ${({ theme }) => theme.colors.bg.primary};
`;

export const GridTable = styled.table`
    width: 100%;
    min-width: max-content;
    table-layout: fixed;
    border-collapse: separate;
    border-spacing: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 13px;
`;

const gridCell = css`
    height: 38px;
    padding: 0;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    text-align: left;
`;

export const GridHeader = styled.th<{
    $system?: boolean;
    $compact?: boolean;
    $fill?: boolean;
    $sortable?: boolean;
    $width?: number;
}>`
    ${gridCell}
    position: sticky;
    z-index: 3;
    top: 0;
    width: ${({ $compact, $fill, $system, $width }) => (
        $fill ? '80px' : $width ? `${$width}px` : $compact ? '1%' : $system ? '160px' : '200px'
    )};
    min-width: ${({ $compact, $fill, $system, $width }) => (
        $fill ? '80px' : $width ? `${$width}px` : $compact ? '44px' : $system ? '160px' : '200px'
    )};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 600;
    cursor: ${({ $sortable }) => $sortable ? 'pointer' : 'default'};

    &:hover,
    &:focus-within,
    &:has([aria-expanded='true']) {
        z-index: 6;
    }
`;

export const SelectionHeader = styled(GridHeader)`
    z-index: 5;
    left: 0;
    width: 32px;
    min-width: 32px;
    text-align: center;
`;

export const HeaderContent = styled.div`
    position: relative;
    display: flex;
    height: 100%;
    align-items: center;
    gap: 6px;
    padding: 0 9px;

    > svg {
        flex: 0 0 auto;
    }
`;

export const AppendColumnHeaderContent = styled(HeaderContent)`
    justify-content: flex-start;
    padding: 0 0 0 15px;
`;

export const ColumnResizeHandle = styled.button`
    position: absolute;
    z-index: 9;
    top: 0;
    right: -3px;
    width: 7px;
    height: 100%;
    padding: 0;
    border: 0;
    outline: none;
    background: transparent;
    cursor: col-resize;
    touch-action: none;

    &::after {
        position: absolute;
        top: 0;
        bottom: 0;
        left: 3px;
        width: 1px;
        background: transparent;
        content: '';
    }

    &:hover::after,
    &:focus-visible::after,
    &:active::after {
        background: ${({ theme }) => theme.colors.border.hardened};
    }
`;

export const ColumnType = styled.span`
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const ColumnName = styled.span<{ $editable?: boolean }>`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: ${({ $editable }) => $editable ? 'text' : 'inherit'};
`;

export const HeaderSpacer = styled.span`
    min-width: 0;
    flex: 1;
    overflow: hidden;
`;

export const ColumnActions = styled.span`
    position: absolute;
    top: 50%;
    right: 7px;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    gap: 1px;
    padding-left: 5px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    opacity: 0;
    pointer-events: none;
    transform: translateY(-50%);
    transition: opacity ${({ theme }) => theme.transition.fast};

    ${GridHeader}:hover &,
    ${GridHeader}:focus-within & {
        opacity: 1;
        pointer-events: auto;
    }

    @media (hover: none) {
        opacity: 1;
        pointer-events: auto;
    }
`;

export const ColumnMenuRoot = styled.span`
    position: relative;
    display: inline-flex;
`;

export const TinyAction = styled.button<{ $danger?: boolean; $active?: boolean }>`
    display: inline-flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: 3px;
    background: ${({ $active, theme }) => $active ? `${theme.colors.brand}1a` : 'transparent'};
    color: ${({ $active, $danger, theme }) => (
        $danger ? theme.colors.accent.error : $active ? theme.colors.brand : theme.colors.text.tertiary
    )};
    cursor: pointer;
    &:hover:not(:disabled) { background: ${({ theme }) => theme.colors.bg.hover}; }
    &:disabled { cursor: default; opacity: 0.3; }
`;

export const ColumnFilterRoot = styled.span`
    position: relative;
    display: inline-flex;
`;

export const ColumnFilterPopover = styled.div`
    position: absolute;
    z-index: 12;
    top: calc(100% + 5px);
    left: 0;
    width: 260px;
    padding: 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const ColumnFilterTitle = styled.div`
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 1px 1px 9px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    font-weight: 600;

    svg {
        color: ${({ theme }) => theme.colors.brand};
    }
`;

export const ColumnFilterForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 9px;
`;

export const ColumnFilterField = styled.label`
    display: flex;
    min-width: 0;
    flex-direction: column;
    gap: 4px;
`;

export const ColumnFilterLabel = styled.span`
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    font-weight: 500;
`;

export const ColumnFilterInput = styled.input`
    width: 100%;
    height: 32px;
    padding: 0 8px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;
    font-size: 11px;

    &:focus {
        border-color: ${({ theme }) => theme.colors.brand};
        box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.brand}1a`};
    }
`;

export const ColumnFilterActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 5px;
    padding-top: 2px;
`;

export const ColumnMenu = styled.span`
    position: absolute;
    z-index: 10;
    top: calc(100% + 4px);
    left: 0;
    display: flex;
    min-width: 140px;
    flex-direction: column;
    gap: 2px;
    overflow: hidden;
    padding: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const ColumnMenuItem = styled.button<{ $danger?: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 8px;
    padding: 6px 10px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: transparent;
    color: ${({ $danger, theme }) => $danger ? theme.colors.accent.error : theme.colors.text.primary};
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    font-weight: 400;
    text-align: left;

    &:hover,
    &:focus-visible {
        background: ${({ $danger, theme }) => (
        $danger ? theme.colors.accent.errorBg : theme.colors.bg.hover
    )};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const GridCell = styled.td<{
    $selected?: boolean;
    $system?: boolean;
    $compact?: boolean;
    $fill?: boolean;
    $focused?: boolean;
    $width?: number;
}>`
    ${gridCell}
    position: relative;
    z-index: ${({ $focused }) => $focused ? 4 : 'auto'};
    outline: none;
    width: ${({ $compact, $fill, $system, $width }) => (
        $fill ? '80px' : $width ? `${$width}px` : $compact ? '1%' : $system ? '160px' : '200px'
    )};
    min-width: ${({ $compact, $fill, $system, $width }) => (
        $fill ? '80px' : $width ? `${$width}px` : $compact ? '44px' : $system ? '160px' : '200px'
    )};
    background: ${({ $focused, $selected, theme }) => (
        $focused
            ? `${theme.colors.brand}1a`
            : $selected ? `${theme.colors.accent.primary}0d` : theme.colors.bg.primary
    )};
    box-shadow: none;

    &:focus-within {
        z-index: 4;
        background: ${({ theme }) => `${theme.colors.brand}1a`};
        box-shadow: none;
    }
`;

export const SelectionCell = styled(GridCell)`
    position: sticky;
    z-index: 2;
    left: 0;
    width: 32px;
    min-width: 32px;
    background: ${({ $selected, theme }) => $selected ? `${theme.colors.accent.primary}16` : theme.colors.bg.secondary};
    text-align: center;
`;

export const AppendRowCell = styled.td`
    ${gridCell}
    padding: 0 6px;
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const SelectionCheckbox = styled.button<{ $checked: boolean; $mixed: boolean }>`
    display: inline-flex;
    width: 18px;
    height: 18px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 1px solid ${({ $checked, $mixed, theme }) => (
        $checked || $mixed ? theme.colors.brand : theme.colors.border.hardened
    )};
    border-radius: 5px;
    outline: none;
    background: ${({ $checked, $mixed, theme }) => (
        $checked ? theme.colors.brand : $mixed ? `${theme.colors.brand}1a` : theme.colors.bg.primary
    )};
    color: ${({ $checked, theme }) => $checked ? theme.colors.white : theme.colors.brand};
    cursor: pointer;
    vertical-align: middle;
    transition:
        background ${({ theme }) => theme.transition.fast},
        border-color ${({ theme }) => theme.transition.fast},
        transform ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.brand};
        transform: scale(1.05);
    }

    &:focus-visible {
        border-color: ${({ theme }) => theme.colors.brand};
        box-shadow: 0 0 0 2px ${({ theme }) => `${theme.colors.brand}33`};
    }
`;

export const CellInput = styled.input`
    width: 100%;
    height: 37px;
    padding: 0 8px;
    border: 1px solid transparent;
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;

    &:focus {
        border-color: transparent;
        background: transparent;
    }

    &:disabled {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const CellDisplay = styled.div<{ $disabled: boolean }>`
    display: flex;
    width: 100%;
    height: 37px;
    align-items: center;
    padding: 0 8px;
    cursor: ${({ $disabled }) => $disabled ? 'default' : 'pointer'};
    user-select: text;
`;

export const CellDisplayValue = styled.span<{ $null: boolean }>`
    overflow: hidden;
    color: ${({ $null, theme }) => $null ? theme.colors.text.tertiary : theme.colors.text.primary};
    font-style: ${({ $null }) => $null ? 'italic' : 'normal'};
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const LineFeedMark = styled.span`
    display: inline-flex;
    align-items: center;
    margin: 0 2px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    vertical-align: middle;
`;

export const DateTimeCellWrap = styled.div`
    position: relative;
    width: 100%;

    ${CellInput} {
        padding-right: 54px;

        &::-webkit-calendar-picker-indicator {
            display: none;
        }
    }
`;

export const ValueCellWrap = styled.div`
    position: relative;
    width: 100%;

    ${CellInput} {
        padding-right: 32px;
    }
`;

export const CellInputActions = styled.div`
    position: absolute;
    top: 0;
    right: 5px;
    display: flex;
    height: 37px;
    align-items: center;
    gap: 1px;
`;

export const DateTimeActions = styled(CellInputActions)``;

export const CellUtilityButton = styled.button`
    display: inline-flex;
    width: 20px;
    height: 20px;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.xs};
    outline: none;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;

    &:hover:not(:disabled),
    &:focus-visible {
        background: ${({ theme }) => theme.colors.bg.hover};
        color: ${({ theme }) => theme.colors.brand};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 0.4;
    }
`;

export const CellTextarea = styled.textarea`
    position: absolute;
    z-index: 8;
    top: -1px;
    left: -1px;
    width: max(100%, 320px);
    height: 112px;
    box-sizing: border-box;
    padding: 8px;
    border: 1px solid ${({ theme }) => theme.colors.brand};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;
    line-height: 1.45;
    resize: vertical;
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const BooleanCellWrap = styled.div<{ $disabled: boolean }>`
    display: flex;
    height: 37px;
    align-items: center;
    padding: 0 8px;
    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
    user-select: none;
`;

export const BooleanLabel = styled.span`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 600;
`;

export const BooleanEditor = styled.div`
    position: absolute;
    z-index: 8;
    top: -1px;
    left: -1px;
    width: calc(100% + 2px);
    border: 1px solid ${({ theme }) => theme.colors.brand};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const BooleanEditorValue = styled.div`
    display: flex;
    height: 37px;
    align-items: center;
    gap: 7px;
    padding: 0 8px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;

    span {
        flex: 1;
    }

    svg:first-child {
        color: ${({ theme }) => theme.colors.brand};
    }

    svg:last-child {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const BooleanEditorMenu = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: -1px;
    display: flex;
    width: calc(100% + 2px);
    flex-direction: column;
    gap: 2px;
    padding: 4px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const BooleanEditorOption = styled.button<{ $active: boolean }>`
    display: flex;
    width: 100%;
    align-items: center;
    gap: 7px;
    padding: 7px 8px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ $active, theme }) => $active ? theme.colors.bg.hover : 'transparent'};
    color: ${({ theme }) => theme.colors.text.secondary};
    cursor: pointer;
    font: inherit;
    font-size: 12px;
    text-align: left;

    svg {
        color: ${({ theme }) => theme.colors.brand};
    }
`;

export const SystemValue = styled.span`
    display: block;
    overflow: hidden;
    padding: 0 8px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
    font-size: 11px;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const GridFooter = styled.footer`
    display: flex;
    min-height: 42px;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 0 12px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;

export const Pagination = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
`;

export const PaginationLimit = styled.label`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    margin-left: 4px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    white-space: nowrap;
`;

export const PaginationLimitSelect = styled.select`
    height: 24px;
    padding: 0 6px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 10px;

    &:disabled {
        cursor: not-allowed;
        opacity: 0.5;
    }
`;

export const ErrorBanner = styled.div`
    padding: 7px 12px;
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 11px;
`;

export const Loading = styled.div`
    display: flex;
    height: 100%;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    svg { animation: ${spin} 0.7s linear infinite; }
`;

export const ModalForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const ModalActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
`;

export const ExportIntro = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    line-height: 1.55;
`;

export const ExportHint = styled.div`
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
`;

export const ImportSummary = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 9px 11px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const ImportSummaryText = styled.div`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;

    strong {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ImportFormat = styled.span`
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => `${theme.colors.accent.primary}18`};
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 10px;
    font-weight: 700;
`;

export const ImportPreviewWrap = styled.div`
    overflow: hidden;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
`;

export const ImportPreview = styled.table`
    width: 100%;
    border-collapse: collapse;
    font-size: 11px;

    th,
    td {
        overflow: hidden;
        max-width: 180px;
        padding: 6px 8px;
        border-right: 1px solid ${({ theme }) => theme.colors.border.default};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        text-align: left;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    th:last-child,
    td:last-child {
        border-right: 0;
    }

    tbody tr:last-child td {
        border-bottom: 0;
    }

    th {
        background: ${({ theme }) => theme.colors.bg.tertiary};
        color: ${({ theme }) => theme.colors.text.secondary};
        font-weight: 600;
    }

    td {
        color: ${({ theme }) => theme.colors.text.primary};
    }

    td[data-null='true'] {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-style: italic;
    }
`;

export const ImportPreviewMore = styled.div`
    padding: 6px 8px;
    border-top: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 10px;
    text-align: center;
`;

export const ImportErrors = styled.div`
    display: flex;
    max-height: 130px;
    flex-direction: column;
    gap: 3px;
    overflow-y: auto;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 11px;
`;

export const Field = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const FieldLabel = styled.label`
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 12px;
    font-weight: 500;
`;

export const TextArea = styled.textarea`
    resize: vertical;
    width: 100%;
    min-height: 72px;
    padding: 8px 10px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font: inherit;
    font-size: 13px;
    &:focus { border-color: ${({ theme }) => theme.colors.border.focus}; }
`;

export const InlineForm = styled.form`
    display: flex;
    gap: 6px;
    padding: 8px 10px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const InlineInput = styled.input`
    width: 100%;
    min-width: 0;
    flex: 1;
    box-sizing: border-box;
    padding: 6px 8px;
    border: 1px solid ${({ theme }) => theme.colors.border.focus};
    border-radius: ${({ theme }) => theme.radius.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
`;

export const TypeSelectRoot = styled.div`
    width: 156px;
    flex: 0 0 156px;
`;
