import styled from 'styled-components';

export const Options = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
`;

export const Option = styled.button<{
    $active: boolean;
    $color: string;
    $unavailable: boolean;
}>`
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 10px 12px;
    border: 1px solid
        ${({ theme, $active, $color }) =>
            $active ? $color : theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme, $active, $color }) =>
        $active ? `${$color}10` : theme.colors.bg.primary};
    cursor: ${({ $unavailable }) => $unavailable ? 'not-allowed' : 'pointer'};
    opacity: ${({ $unavailable }) => $unavailable ? 0.5 : 1};
    transition: all ${({ theme }) => theme.transition.fast};
    text-align: left;

    &:hover:not(:disabled) {
        border-color: ${({ $color }) => $color};
    }
`;

export const OptionIcon = styled.div<{ $color: string; $unavailable: boolean }>`
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ $color, $unavailable, theme }) =>
        $unavailable ? theme.colors.bg.tertiary : `${$color}15`};
    color: ${({ $color, $unavailable, theme }) =>
        $unavailable ? theme.colors.text.tertiary : $color};
    flex-shrink: 0;
`;

export const OptionText = styled.div`
    display: flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;
`;

export const OptionTitle = styled.div`
    font-size: 13px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
`;

export const OptionDescription = styled.div`
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    line-height: 1.4;
`;
