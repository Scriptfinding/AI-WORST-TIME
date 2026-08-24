import styled from 'styled-components';

export const Tree = styled.div`
    flex: 1;
    min-height: 0;
    overflow: auto;
    padding: 6px;
    min-width: 100%;
    overscroll-behavior: contain;
`;

export const Row = styled.div<{ $depth?: number }>`
    display: grid;
    grid-template-columns: 14px auto minmax(0, 1fr);
    align-items: center;
    gap: 6px;
    padding: 4px 8px 4px ${({ $depth = 0 }) => 8 + $depth * 16}px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.secondary};
    min-width: max-content;
`;

export const CollapseButton = styled.button`
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 20px;
    padding: 0;
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: transparent;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const CollapseSpacer = styled.span`
    width: 14px;
`;

export const TypeBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    max-width: 100%;
    min-height: 24px;
    padding: 0 7px 0 0;
    border: 1px solid color-mix(
        in srgb,
        ${({ theme }) => theme.colors.border.default} 70%,
        ${({ theme }) => theme.colors.bg.primary}
    );
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.primary};
    flex-shrink: 0;
    cursor: pointer;
    user-select: none;

    &&& {
        cursor: pointer;
        user-select: none;
    }

    &&& * {
        cursor: pointer;
        user-select: none;
    }

    &:hover {
        background: color-mix(
            in srgb,
            ${({ theme }) => theme.colors.bg.hover} 40%,
            ${({ theme }) => theme.colors.bg.primary}
        );
    }
`;

export const TypeIcon = styled.span`
    align-self: stretch;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    padding: 0 5px;
    border-right: 1px solid ${({ theme }) => theme.colors.border.default};
`;

export const Name = styled.span`
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
    color: ${({ theme }) => theme.colors.text.secondary};
    padding: 3px 0;
`;

export const Summary = styled.small`
    grid-column: 3;
    font-size: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
`;

export const Value = styled.span`
    grid-column: 3;
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-family: ${({ theme }) => theme.font.mono};
    font-size: 11px;
`;
