import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

export const NodeField = styled.div<{ $invalid?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 3px;
    padding: 14px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ $invalid }) => ($invalid ? '0 0 0 2px #ef444426' : 'none')};

    input:not([data-object-key-input]),
    select,
    textarea {
        width: 100%;
        min-width: 0;
        padding: 10px 11px;
        border-radius: ${({ theme }) => theme.radius.md};
        border: 1px solid ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        background: ${({ theme }) => theme.colors.bg.primary};
        outline: none;

        &::placeholder {
            color: ${({ theme }) => theme.colors.text.tertiary};
        }

        &:focus {
            border-color: ${({ theme, $invalid }) => ($invalid ? '#ef4444' : theme.colors.border.default)};
            box-shadow: none;
        }
    }

    textarea {
        min-height: 150px;
        resize: vertical;
        font-family: ${({ theme }) => theme.font.mono};
        line-height: 1.5;
    }
`;

export const ExpressionHeaderActions = styled.div`
    position: absolute;
    right: 0px;
    top: -25px;
    display: inline-flex;
    align-items: center;
    justify-content: flex-end;
    gap: 2px;
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast};
    z-index: 4;
`;

export const ExpressionEditorWrap = styled.div`
    position: relative;

    select {
        cursor: pointer;
    }

    &:hover ${ExpressionHeaderActions},
    &:focus-within ${ExpressionHeaderActions} {
        opacity: 1;
        pointer-events: auto;
    }
`;

export const ExpressionCodeEditor = styled.div<{ $renderVisible?: boolean; $codeInput?: boolean }>`
    width: 100%;
    min-height: ${({ $codeInput }) => ($codeInput ? '160px' : '34px')};
    max-height: ${({ $codeInput }) => ($codeInput ? '260px' : '142px')};
    overflow: hidden;
    border-radius: ${({ theme, $renderVisible }) => $renderVisible
        ? `${theme.radius.md} ${theme.radius.md} 0 0`
        : theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};

    &:focus-within {
        border-color: ${({ theme }) => theme.colors.border.default};
        box-shadow: none;
    }

    .monaco-editor,
    .monaco-editor .margin,
    .monaco-editor-background,
    .monaco-editor .inputarea.ime-input {
        background-color: ${({ theme }) => theme.colors.bg.primary} !important;
    }

    .monaco-editor .editorPlaceholder {
        white-space: pre;
    }

    /* The slim 6px scrollbar of small inputs gets fully rounded ends;
       real code editors keep Monaco's default square slider. */
    .monaco-scrollable-element > .scrollbar.vertical > .slider {
        border-radius: ${({ $codeInput }) => ($codeInput ? '0' : '3px')};
    }

    .nop-template-token {
        color: ${({ theme }) => theme.colors.accent.success} !important;
        background: ${({ theme }) => theme.colors.accent.successBg};
        border-radius: 3px;
    }
`;

export const Picker = styled.div`
    position: relative;
    width: 100%;
    min-width: 0;
`;

export const PickerTrigger = styled.button<{
    $open?: boolean;
    $hasValue?: boolean;
    $loading?: boolean;
}>`
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    overflow: hidden;
    min-height: 38px;
    padding: 10px 11px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ theme, $hasValue, $loading }) => (
        $hasValue && !$loading ? theme.colors.text.primary : theme.colors.text.tertiary
    )};
    background: ${({ theme }) => theme.colors.bg.primary};
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    text-align: left;
    cursor: pointer;

    > svg {
        flex: 0 0 auto;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transform: rotate(${({ $open }) => $open ? '180deg' : '0deg'});
        transition: transform ${({ theme }) => theme.transition.fast};
    }

    &:hover:not(:disabled) {
        border-color: ${({ theme }) => theme.colors.border.light};
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    &:disabled {
        cursor: not-allowed;
        color: ${({ theme }) => theme.colors.text.secondary};
        background: ${({ theme }) => theme.colors.bg.tertiary};
    }
`;

export const PickerValue = styled.span`
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 8px;
    overflow: hidden;

    > span:last-child {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
`;

export const PickerProviderIcon = styled.span`
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

export const PickerLoadingIcon = styled(PickerProviderIcon)`
    color: ${({ theme }) => theme.colors.text.tertiary};

    svg {
        animation: ${spin} 0.8s linear infinite;
    }
`;

export const DropdownClearButton = styled.button`
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

export const Dropdown = styled.div`
    position: absolute;
    z-index: 10000;
    top: calc(100% + 5px);
    left: 0;
    right: 0;
    max-height: 260px;
    overflow: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const SearchInput = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 9px !important;
    border-radius: ${({ theme }) => theme.radius.sm} !important;
    border: 1px solid ${({ theme }) => theme.colors.border.default} !important;
    color: ${({ theme }) => theme.colors.text.primary} !important;
    font-size: 12px !important;
    background: ${({ theme }) => theme.colors.bg.secondary} !important;
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.colors.border.default} !important;
        box-shadow: none !important;
    }
`;

export const DropdownHeader = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
`;

export const DropdownHeaderButton = styled.button<{ $loading?: boolean }>`
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

export const DropdownActionRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const DropdownAction = styled.button`
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

export const Option = styled.button<{ $selected?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 10px;
    padding: 8px 9px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme, $selected }) => $selected ? theme.colors.bg.hover : 'transparent'};
    text-align: left;
    cursor: pointer;

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        font-weight: 600;
    }

    span {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
    }

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const OptionMain = styled.div`
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;

    svg {
        flex-shrink: 0;
    }
`;

export const OptionDetail = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;

    svg {
        flex-shrink: 0;
    }
`;

export const Empty = styled.div`
    padding: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    text-align: center;
`;

export const Loading = styled(Empty)`
    display: flex;
    align-items: center;
    justify-content: center;

    svg {
        animation: ${spin} 0.8s linear infinite;
    }
`;
