import styled from 'styled-components';

export const Panel = styled.div<{ $width?: string }>`
    display: flex;
    flex-direction: column;
    ${({ $width }) => $width ? `flex: 0 0 ${$width};` : 'flex: 1;'}
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
    overflow: hidden;

    @media (max-width: 1024px) {
        ${({ $width }) => $width ? 'flex: 0 1 280px; min-width: 200px;' : ''}
    }

    @media (max-width: 768px) {
        flex: 1 !important;
        min-width: 0 !important;
        border-right: none;
    }
`;

const PANEL_HEADER_HEIGHT = '46px';

export const PanelHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 14px;
    height: ${PANEL_HEADER_HEIGHT};
    min-height: ${PANEL_HEADER_HEIGHT};
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
    flex-shrink: 0;
    gap: 8px;
`;

export const PanelHeaderLeft = styled.div`
    display: flex;
    align-items: center;
    gap: 8px;
    flex: 1;
    min-width: 0;
`;

export const PanelHeaderRight = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    flex-shrink: 0;
`;

export const PanelTitle = styled.h2`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const PanelBody = styled.div`
    flex: 1;
    overflow-y: auto;
`;

export const EmptyPanel = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    height: 100%;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    text-align: center;
    padding: 24px;
`;

export const ModalForm = styled.form`
    display: flex;
    flex-direction: column;
    gap: 16px;
`;

export const InputGroup = styled.div`
    display: flex;
    align-items: stretch;
`;

export const InputLeft = styled.div`
    flex: 1;
    input { border-radius: ${({ theme }) => theme.radius.md} 0 0 ${({ theme }) => theme.radius.md}; }
`;

export const InputSuffix = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 0 12px;
    font-size: 13px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-left: none;
    border-radius: 0 ${({ theme }) => theme.radius.md} ${({ theme }) => theme.radius.md} 0;
    white-space: nowrap;
`;

export const ModalActions = styled.div`
    display: flex;
    justify-content: flex-end;
    gap: 8px;
    padding-top: 4px;
`;

export const InputWrap = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const InputLabel = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const HelperText = styled.p`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin: 0;
`;

// ── Group combobox ──

export const ComboboxWrapper = styled.div`
    position: relative;
`;

export const ComboboxLabel = styled.label`
    display: block;
    font-size: 12px;
    font-weight: 500;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const ComboboxTrigger = styled.button<{ $open?: boolean; $hasValue?: boolean }>`
    display: flex;
    align-items: center;
    gap: 6px;
    width: 100%;
    padding: 8px 10px;
    font-size: 13px;
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.accent.primary : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ $hasValue, theme }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    cursor: pointer;
    text-align: left;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    svg:last-child {
        margin-left: auto;
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
        transition: transform 150ms ease;
        transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
    }
`;

export const ComboboxClear = styled.span`
    display: flex;
    align-items: center;
    margin-left: auto;
    color: ${({ theme }) => theme.colors.text.tertiary};
    cursor: pointer;
    padding: 0 2px;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const ComboboxPanel = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    background: ${({ theme }) => theme.colors.bg.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.12);
    z-index: 1100;
    overflow: hidden;
    animation: dropIn 120ms ease;
`;

export const ComboboxCreate = styled.button`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: transparent;
    color: ${({ theme }) => theme.colors.accent.primary};
    font-weight: 500;
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
    }
`;

export const DropdownSearchWrapper = styled.div`
    padding: 6px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const DropdownSearchInput = styled.input`
    width: 100%;
    padding: 6px 8px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &:focus {
        border-color: ${({ theme }) => theme.colors.accent.primary};
    }

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const GroupDropdownList = styled.div`
    max-height: 220px;
    overflow-y: auto;
    padding: 4px;
`;

export const GroupDropdownItem = styled.button<{ $active?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 7px 10px;
    font-size: 13px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $active, theme }) => $active ? theme.colors.accent.primary + '14' : 'transparent'};
    color: ${({ $active, theme }) => $active ? theme.colors.accent.primary : theme.colors.text.primary};
    font-weight: ${({ $active }) => $active ? 600 : 400};
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const GroupDropdownEmpty = styled.div`
    padding: 12px 10px;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;
