import styled from 'styled-components';

export const ValueWithLink = styled.span`
    display: inline-flex;
    align-items: center;
    min-width: 0;
    gap: 3px;
`;

export const PrimitiveValue = styled.span<{
    $kind?: 'default' | 'string' | 'number' | 'boolean' | 'null' | 'reference';
}>`
    color: ${({ theme, $kind = 'default' }) => (
        $kind === 'number' || $kind === 'boolean' ? theme.colors.accent.info
        : $kind === 'null' ? theme.colors.text.tertiary
        : theme.colors.text.secondary
    )};
`;

export const ReferenceId = styled.span`
    opacity: 0.45;
`;

export const ReferenceLabel = styled.span`
    margin: 0 2px;
    padding: 0 4px;
    border-radius: 4px;
    background: ${({ theme }) => theme.colors.accent.infoBg};
    color: ${({ theme }) => theme.colors.accent.info};
`;

export const ResourceEditLink = styled.a`
    display: inline-flex;
    flex: 0 0 auto;
    align-items: center;
    justify-content: center;
    width: 14px;
    height: 14px;
    border-radius: 3px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-decoration: none;
    cursor: pointer !important;

    svg,
    use {
        cursor: pointer !important;
        pointer-events: none;
    }

    &:hover {
        color: ${({ theme }) => theme.colors.accent.info};
        background: ${({ theme }) => theme.colors.accent.infoBg};
    }
`;

export const PlaceholderBadge = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    max-width: 220px;
    padding: 2px 6px;
    border-radius: ${({ theme }) => theme.radius.sm};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    user-select: text;

    span {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 9px;
        font-weight: 700;
        letter-spacing: 0.04em;
        text-transform: uppercase;
    }

    strong {
        min-width: 0;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 10px;
        font-weight: 600;
    }
`;
