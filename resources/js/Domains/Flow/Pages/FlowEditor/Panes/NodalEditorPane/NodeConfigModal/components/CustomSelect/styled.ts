import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

export const SelectRoot = styled.div<{ $compact?: boolean }>`
    position: relative;
    width: ${({ $compact }) => ($compact ? 'auto' : '100%')};
    min-width: 0;
`;

export const SelectTrigger = styled.button<{
    $open?: boolean;
    $compact?: boolean;
    $compactHeight?: number;
    $hasValue?: boolean;
    $invalid?: boolean;
}>`
    width: 100%;
    min-height: ${({ $compact, $compactHeight }) => ($compact ? `${$compactHeight ?? 30}px` : '38px')};
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: ${({ $compact }) => ($compact ? '0 7px' : '10px 11px')};
    border-radius: ${({ theme, $compact }) => ($compact ? theme.radius.sm : theme.radius.md)};
    border: 1px solid ${({ theme, $invalid }) => (
        $invalid ? theme.colors.accent.error : theme.colors.border.default
    )};
    color: ${({ theme, $hasValue }) => ($hasValue ? theme.colors.text.primary : theme.colors.text.tertiary)};
    background: ${({ theme }) => theme.colors.bg.primary};
    font-size: ${({ $compact }) => ($compact ? '11px' : '12px')};
    font-weight: ${({ $compact }) => ($compact ? 600 : 500)};
    line-height: 1.2;
    text-align: left;
    cursor: pointer;
    outline: none;

    > svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: transform ${({ theme }) => theme.transition.fast};
        transform: ${({ $open }) => ($open ? 'rotate(180deg)' : 'none')};
    }

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    &:disabled {
        cursor: not-allowed;
        opacity: 1;
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
        border-color: ${({ theme }) => theme.colors.border.default};
    }
`;

export const SelectClearButton = styled.button`
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.accent.error};
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const SelectValueLabel = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    cursor: inherit;
    pointer-events: none;
`;

export const SelectValue = styled.span`
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    line-height: 15px;
    cursor: inherit;
    pointer-events: none;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SelectIconSlot = styled.span`
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
        display: block;
        flex: 0 0 auto;
    }
`;

export const SelectLoadingIcon = styled(SelectIconSlot)`
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        animation: ${spin} 0.8s linear infinite;
    }
`;

export const SelectDropdown = styled.div<{ $compact?: boolean }>`
    position: fixed;
    z-index: 10000;
    width: auto;
    min-width: 0;
    max-width: calc(100vw - 24px);
    max-height: 260px;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 5px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const SelectSearchInput = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SelectDropdownHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
`;

export const SelectHeaderButton = styled.button<{ $loading?: boolean }>`
    width: 30px;
    height: 30px;
    flex: 0 0 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    svg {
        animation: ${({ $loading }) => ($loading ? spin : 'none')} 0.8s linear infinite;
    }

    &:hover:not(:disabled) {
        color: ${({ theme }) => theme.colors.text.primary};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: default;
        opacity: 0.65;
    }
`;

export const SelectActionRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const SelectAction = styled.button`
    min-width: 0;
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.accent.primary};
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;

    svg {
        flex-shrink: 0;
        animation: ${spin} 0.8s linear infinite;
    }

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: default;
        opacity: 0.65;
    }
`;

export const SelectOptions = styled.div`
    min-height: 0;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const SelectOption = styled.button<{ $active?: boolean; $selected?: boolean }>`
    width: 100%;
    min-width: 0;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme, $active, $selected }) => (
        $active && !$selected
            ? `color-mix(in srgb, ${theme.colors.bg.hover} 55%, transparent)`
            : 'transparent'
    )};
    text-align: left;
    cursor: pointer;

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        font-weight: ${({ $selected }) => ($selected ? 700 : 400)};
        cursor: inherit;
        pointer-events: none;
    }

    span {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
        cursor: inherit;
        pointer-events: none;
    }

    &:hover {
        background: ${({ theme }) => `color-mix(in srgb, ${theme.colors.bg.hover} 55%, transparent)`};
    }
`;

export const SelectCheck = styled.span`
    flex: 0 0 auto;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: inherit !important;
    cursor: inherit;
`;

export const SelectOptionMain = styled.div`
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;
    cursor: inherit;
    pointer-events: none;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const SelectOptionDetail = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;

    svg {
        flex-shrink: 0;
    }
`;

export const SelectEmpty = styled.div`
    padding: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    text-align: center;
`;

export const SelectLoading = styled(SelectEmpty)`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        animation: ${spin} 0.8s linear infinite;
    }
`;
