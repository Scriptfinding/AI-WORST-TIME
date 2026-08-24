import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    to { transform: rotate(360deg); }
`;

export const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    gap: 6px;
    width: 100%;
    position: relative;
`;

export const Label = styled.label`
    font-size: 12px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.secondary};
`;

export const Trigger = styled.button<{ $open?: boolean; $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    height: 38px;
    padding: 0 11px;
    font-size: 12px;
    font-weight: 500;
    line-height: 1.2;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
    text-align: left;
    transition: border-color ${({ theme }) => theme.transition.fast};

    &:hover {
        border-color: ${({ theme, $disabled }) => $disabled ? theme.colors.border.default : theme.colors.border.light};
    }

    ${({ $disabled, theme }) => $disabled && `
        color: ${theme.colors.text.secondary};
        background: ${theme.colors.bg.tertiary};
    `}

    svg:first-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const DisabledHint = styled.span`
    display: block;
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: 4px;
    font-style: italic;
`;

export const TriggerLabel = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const TriggerArrow = styled.span<{ $open?: boolean }>`
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.tertiary};
    transition: transform 150ms ease;
    transform: ${({ $open }) => $open ? 'rotate(180deg)' : 'none'};
`;

export const Panel = styled.div`
    position: absolute;
    top: calc(100% + 4px);
    left: 0;
    right: 0;
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 5px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    z-index: 10000;
    overflow: hidden;
`;

export const SearchWrapper = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 2px;
`;

export const SearchInput = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 9px;
    font-size: 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    outline: none;

    &::placeholder { color: ${({ theme }) => theme.colors.text.tertiary}; }
    &:focus { border-color: ${({ theme }) => theme.colors.accent.primary}; }
`;

export const RefreshButton = styled.button<{ $loading?: boolean }>`
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

export const Loading = styled.div`
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;

    svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
        animation: ${spin} 0.8s linear infinite;
    }
`;

export const List = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
    padding: 0;
    max-height: 260px;
    overflow-y: auto;
`;

export const Option = styled.button<{ $selected?: boolean; $disabled?: boolean }>`
    display: flex;
    align-items: center;
    gap: 8px;
    width: 100%;
    padding: 8px 9px;
    font-size: 12px;
    border: none;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $selected, theme }) => $selected ? theme.colors.bg.hover : 'transparent'};
    color: ${({ theme, $disabled }) => $disabled ? theme.colors.text.tertiary : theme.colors.text.primary};
    cursor: ${({ $disabled }) => $disabled ? 'not-allowed' : 'pointer'};
    opacity: ${({ $disabled }) => $disabled ? 0.55 : 1};
    text-align: left;
    transition: background ${({ theme }) => theme.transition.fast};

    svg:first-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    svg:last-child {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.accent.primary};
    }

    &:hover:not(:disabled) {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const OptionLabel = styled.span`
    flex: 1;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const TeamList = styled.div`
    display: flex;
    flex-direction: column;
    gap: 4px;
`;

export const Separator = styled.div`
    height: 1px;
    background: ${({ theme }) => theme.colors.border.default};
    margin: 4px 0;
`;

export const SectionLabel = styled.div`
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
    padding: 4px 10px 2px;
`;

export const Empty = styled.div`
    padding: 12px;
    text-align: center;
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;
