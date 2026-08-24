import styled, { keyframes } from 'styled-components';

const spin = keyframes`
    to {
        transform: rotate(360deg);
    }
`;

export const Wrapper = styled.div`
    position: relative;
    width: 100%;
    min-width: 0;
`;

export const IconSlot = styled.span<{ $loading?: boolean }>`
    width: 15px;
    height: 15px;
    flex: 0 0 15px;
    display: inline-flex;
    align-items: center;
    justify-content: center;

    svg {
        display: block;
        animation: ${({ $loading }) => $loading ? spin : 'none'} 0.8s linear infinite;
    }
`;

export const ValueLabel = styled.span`
    min-width: 0;
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
`;

export const Trigger = styled.button<{
    $open?: boolean;
    $hasValue?: boolean;
    $variableType?: string;
}>`
    width: 100%;
    min-width: 0;
    box-sizing: border-box;
    display: flex;
    align-items: center;
    gap: 9px;
    padding: 8px 10px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme, $open }) => $open ? theme.colors.border.focus : theme.colors.border.default};
    color: ${({ theme, $hasValue }) => $hasValue ? theme.colors.text.primary : theme.colors.text.tertiary};
    font-size: 12px;
    font-weight: 400;
    line-height: 1.2;
    background: ${({ theme }) => theme.colors.bg.primary};
    outline: none;
    overflow: hidden;
    cursor: pointer;
    text-align: left;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }

    > ${IconSlot} {
        color: ${({ theme, $variableType }) => (
            $variableType === 'secret' || $variableType === 'otp' || $variableType === 'vault'
                ? theme.colors.accent.warning
                : $variableType
                    ? theme.colors.accent.info
                    : theme.colors.text.tertiary
        )};
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

export const ClearButton = styled.button`
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

export const Panel = styled.div<{
    $top: number;
    $left: number;
    $width: number;
    $maxHeight: number;
    $placement: 'above' | 'below';
}>`
    position: fixed;
    top: ${({ $top }) => $top}px;
    left: ${({ $left }) => $left}px;
    width: ${({ $width }) => $width}px;
    max-height: ${({ $maxHeight }) => $maxHeight}px;
    transform: ${({ $placement }) => $placement === 'above' ? 'translateY(-100%)' : 'none'};
    z-index: 10002;
    overflow: hidden;
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding: 5px;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
`;

export const SearchRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    margin-bottom: 3px;
`;

export const Search = styled.input`
    min-width: 0;
    flex: 1;
    width: 100%;
    padding: 8px 9px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 12px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    outline: none;

    &::placeholder {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const RefreshButton = styled.button<{ $loading?: boolean }>`
    flex-shrink: 0;
    width: 30px;
    height: 30px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
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
        cursor: wait;
        opacity: 0.6;
    }
`;

export const ActionRow = styled.div`
    display: flex;
    align-items: center;
    gap: 4px;
    padding-bottom: 4px;
    margin-bottom: 2px;
    border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const CreateButton = styled.button`
    min-width: 0;
    flex: 1;
    width: 100%;
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 8px 9px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.accent.primary};
    background: transparent;
    font-size: 12px;
    font-weight: 600;
    text-align: left;
    cursor: pointer;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }
`;

export const List = styled.div`
    min-height: 0;
    max-height: 180px;
    overflow-y: auto;
    display: flex;
    flex-direction: column;
    gap: 2px;
`;

export const Item = styled.button<{ $active?: boolean }>`
    width: 100%;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    padding: 8px 9px;
    border: 0;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme, $active }) => $active ? theme.colors.bg.hover : 'transparent'};
    cursor: pointer;
    text-align: left;

    &:hover {
        background: ${({ theme }) => theme.colors.bg.hover};
    }

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
        display: inline-flex;
        align-items: center;
        gap: 4px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;

        svg {
            flex-shrink: 0;
        }
    }
`;

export const ItemMain = styled.div`
    min-width: 0;
    display: inline-flex;
    align-items: center;
    gap: 7px;

    svg {
        flex-shrink: 0;
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const Empty = styled.div`
    padding: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    text-align: center;
`;
