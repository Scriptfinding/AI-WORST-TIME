import styled from 'styled-components';

export const Grid = styled.div`
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
    gap: 16px;
    align-content: start;
`;

export const Card = styled.div<{ $color?: string }>`
    display: flex;
    flex-direction: column;
    gap: 12px;
    height: 185px;
    padding: 18px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        radial-gradient(circle at top right, ${({ $color }) => $color || '#16a34a'}26, transparent 42%),
        ${({ theme }) => theme.colors.bg.secondary};
    cursor: pointer;
    transition: border-color ${({ theme }) => theme.transition.fast}, transform ${({ theme }) => theme.transition.fast};

    &:hover,
    &:focus-visible {
        border-color: ${({ $color }) => $color || '#16a34a'}66;
        outline: none;
    }
`;

export const CardHeader = styled.div`
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
`;

export const CardHeaderMain = styled.div`
    display: flex;
    align-items: flex-start;
    gap: 12px;
    min-width: 0;
`;

export const CardText = styled.div`
    min-width: 0;
    flex: 1;
`;

export const IconBox = styled.div`
    inline-size: 42px;
    block-size: 42px;
    min-inline-size: 42px;
    max-inline-size: 42px;
    min-block-size: 42px;
    max-block-size: 42px;
    aspect-ratio: 1 / 1;
    flex: 0 0 42px;
    box-sizing: border-box;
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.primary};
    display: flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    color: ${({ theme }) => theme.colors.accent.primary};

    img {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        min-inline-size: 100%;
        min-block-size: 100%;
        object-fit: cover;
    }
`;

export const CardTitle = styled.div`
    font-size: 15px;
    font-weight: 700;
    color: ${({ theme }) => theme.colors.text.primary};
    line-height: 18px;
    max-height: 36px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const CardMeta = styled.div`
    font-size: 12px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    margin-top: 2px;
`;

export const Description = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 18px;
    flex: 0 0 auto;
    max-height: 36px;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
    text-overflow: ellipsis;
`;

export const InstalledPill = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 5px;
    width: fit-content;
    padding: 5px 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent.successBg};
    color: ${({ theme }) => theme.colors.accent.success};
    font-size: 11px;
    font-weight: 700;
`;

export const Actions = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 8px;
    margin-top: auto;
`;

export const FooterStats = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-left: auto;
`;

export const FooterStat = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 11px;
    font-weight: 700;

    svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const PrivateFooterStat = styled(FooterStat)`
    position: relative;
    cursor: help;

    &:hover > div {
        opacity: 1;
        transform: translateY(0);
        pointer-events: auto;
    }
`;

export const PrivateTooltip = styled.div`
    position: absolute;
    right: 0;
    bottom: calc(100% + 10px);
    z-index: 30;
    min-width: 190px;
    max-width: 260px;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.lg};
    color: ${({ theme }) => theme.colors.text.primary};
    opacity: 0;
    transform: translateY(4px);
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast}, transform ${({ theme }) => theme.transition.fast};

    &::before {
        content: '';
        position: absolute;
        right: 18px;
        bottom: -5px;
        width: 9px;
        height: 9px;
        transform: rotate(45deg);
        border-right: 1px solid ${({ theme }) => theme.colors.border.default};
        border-bottom: 1px solid ${({ theme }) => theme.colors.border.default};
        background: ${({ theme }) => theme.colors.bg.secondary};
    }

    span {
        display: block;
        margin-bottom: 3px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 10px;
        font-weight: 700;
        text-transform: uppercase;
        letter-spacing: 0.04em;
    }

    strong {
        display: block;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 12px;
        line-height: 1.3;
        overflow-wrap: anywhere;
    }
`;

export const Empty = styled.div`
    grid-column: 1 / -1;
    padding: 56px 24px;
    border: 1px dashed ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    color: ${({ theme }) => theme.colors.text.tertiary};
    text-align: center;
`;

export const CenterLoader = styled.div`
    grid-column: 1 / -1;
    min-height: 420px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
    font-weight: 700;
`;

export const Spinner = styled.span`
    width: 24px;
    height: 24px;
    border: 2px solid ${({ theme }) => theme.colors.border.default};
    border-top-color: ${({ theme }) => theme.colors.accent.primary};
    border-radius: 999px;
    animation: library-list-spin 0.75s linear infinite;

    @keyframes library-list-spin {
        to { transform: rotate(360deg); }
    }
`;

export const InlineError = styled.div`
    grid-column: 1 / -1;
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 13px;
`;
