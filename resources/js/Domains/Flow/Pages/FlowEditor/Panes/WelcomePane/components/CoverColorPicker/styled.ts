import styled from 'styled-components';

export const CoverColorPickerWrapper = styled.div<{ $busy?: boolean }>`
    display: flex;
    flex-direction: column;
    gap: 14px;
    opacity: ${({ $busy }) => $busy ? 0.55 : 1};
    pointer-events: ${({ $busy }) => $busy ? 'none' : 'auto'};
    transition: opacity 150ms ease;
`;

export const CoverColorPreview = styled.div<{ $color: string }>`
    height: 64px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ $color }) => `linear-gradient(135deg, ${$color}cc 0%, ${$color}66 50%, ${$color}33 100%)`};
`;

export const CoverColorSectionLabel = styled.div`
    font-size: 11px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const CoverColorGrid = styled.div`
    display: flex;
    gap: 6px;
    flex-wrap: wrap;
`;

export const CoverColorSwatch = styled.button<{ $color: string; $active?: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${props => props.$color};
    cursor: pointer;
    flex-shrink: 0;
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};
    outline-offset: 2px;
    transition: transform ${({ theme }) => theme.transition.fast};

    &:hover { transform: scale(1.15); }
`;

export const CoverDefaultSwatch = styled.button<{ $active?: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: #10b981;
    cursor: pointer;
    flex-shrink: 0;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.7);
    outline: ${({ $active, theme }) =>
        $active ? `2px solid ${theme.colors.brand}` : '2px solid transparent'};
    outline-offset: 2px;
    transition: transform ${({ theme }) => theme.transition.fast};

    &:hover { transform: scale(1.15); }
`;

export const CoverCustomColorLabel = styled.label<{ $active?: boolean; $disabled?: boolean }>`
    width: 28px;
    height: 28px;
    border-radius: ${({ theme }) => theme.radius.sm};
    background: ${({ theme }) => theme.colors.bg.tertiary};
    border: 1px solid ${({ theme }) => theme.colors.border.light};
    cursor: pointer;
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
