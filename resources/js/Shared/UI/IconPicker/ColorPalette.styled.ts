import styled from 'styled-components';

export const SectionLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const ColorRow = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

export const SmallColorSwatch = styled.button<{ $color: string; $active?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${p => p.$color};
    cursor: pointer;
    flex-shrink: 0;
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};
    outline-offset: 2px;
    transition: transform ${({ theme }) => theme.transition.fast};

    &:hover {
        transform: scale(1.15);
    }
`;

export const TransparentSwatch = styled.button<{ $active?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: ${({ theme }) => theme.radius.sm};
    cursor: pointer;
    flex-shrink: 0;
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};
    outline-offset: 2px;
    transition: transform ${({ theme }) => theme.transition.fast};
    background-color: #fff;
    background-image:
        linear-gradient(45deg, #ccc 25%, transparent 25%),
        linear-gradient(-45deg, #ccc 25%, transparent 25%),
        linear-gradient(45deg, transparent 75%, #ccc 75%),
        linear-gradient(-45deg, transparent 75%, #ccc 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0;

    &:hover {
        transform: scale(1.15);
    }
`;

export const CustomColorLabel = styled.label<{ $active?: boolean; $disabled?: boolean }>`
    width: 24px;
    height: 24px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    cursor: ${({ $disabled }) => $disabled ? 'default' : 'pointer'};
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: ${({ theme }) => theme.colors.text.secondary};
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};
    outline-offset: 2px;
    transition: all ${({ theme }) => theme.transition.fast};
    position: relative;

    & > input {
        position: absolute;
        inset: 0;
        opacity: 0;
        width: 100%;
        height: 100%;
        cursor: pointer;
        border: none;
        padding: 0;
    }

    &:hover {
        transform: scale(1.15);
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;
