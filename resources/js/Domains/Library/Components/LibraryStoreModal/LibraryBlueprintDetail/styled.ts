import styled from 'styled-components';

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

export const DetailView = styled.div`
    display: flex;
    flex-direction: column;
    gap: 18px;
    flex: 1;
    min-height: 0;
`;

export const BackButton = styled.button`
    display: inline-flex;
    align-items: center;
    gap: 7px;
    width: fit-content;
    border: 0;
    background: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    font-weight: 700;
    cursor: pointer;

    &:hover {
        color: ${({ theme }) => theme.colors.text.primary};
    }
`;

export const DetailHeader = styled.div<{ $color?: string }>`
    display: grid;
    grid-template-columns: 76px minmax(0, 1fr) auto;
    gap: 18px;
    align-items: start;
    padding: 18px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background:
        radial-gradient(circle at top right, ${({ $color }) => $color || '#16a34a'}26, transparent 42%),
        ${({ theme }) => theme.colors.bg.secondary};
`;

export const DetailIcon = styled(IconBox)`
    inline-size: 76px;
    block-size: 76px;
    min-inline-size: 76px;
    max-inline-size: 76px;
    min-block-size: 76px;
    max-block-size: 76px;
    flex-basis: 76px;
`;

export const DetailTitle = styled.h3`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 24px;
    line-height: 1.2;
`;

export const DetailMeta = styled.div`
    margin: 4px 0 10px;
    color: ${({ theme }) => theme.colors.text.tertiary};
    font-size: 13px;
`;

export const Description = styled.p`
    margin: 0;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    line-height: 1.45;
`;

export const DetailStats = styled.div`
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
`;

export const Stat = styled.span`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 7px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.primary};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 700;

    svg {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const PrivateStat = styled(Stat)`
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
    top: calc(100% + 10px);
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
    transform: translateY(-4px);
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast}, transform ${({ theme }) => theme.transition.fast};

    &::before {
        content: '';
        position: absolute;
        top: -5px;
        right: 18px;
        width: 9px;
        height: 9px;
        transform: rotate(45deg);
        border-left: 1px solid ${({ theme }) => theme.colors.border.default};
        border-top: 1px solid ${({ theme }) => theme.colors.border.default};
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

export const LikeStat = styled.button<{ $liked?: boolean }>`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 4px 7px;
    border-radius: 999px;
    background: ${({ theme, $liked }) => ($liked ? `${theme.colors.accent.success}12` : theme.colors.bg.primary)};
    border: 1px solid ${({ theme, $liked }) => ($liked ? `${theme.colors.accent.success}70` : theme.colors.border.default)};
    color: ${({ theme, $liked }) => ($liked ? theme.colors.accent.success : theme.colors.text.secondary)};
    font-size: 11px;
    font-weight: 700;
    cursor: pointer;
    transition: all ${({ theme }) => theme.transition.fast};

    svg {
        color: currentColor;
    }

    &:hover {
        border-color: ${({ theme }) => theme.colors.brand};
        color: ${({ theme }) => theme.colors.brand};
    }

    &:disabled {
        cursor: wait;
        opacity: 0.7;
    }
`;

export const UsagePill = styled.span`
    display: inline-flex;
    align-items: center;
    padding: 5px 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.bg.secondary};
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 11px;
    font-weight: 700;
`;

export const InstalledPill = styled.a`
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 5px 8px;
    border-radius: 999px;
    background: ${({ theme }) => theme.colors.accent.success}14;
    color: ${({ theme }) => theme.colors.accent.success};
    border: 1px solid ${({ theme }) => theme.colors.accent.success}35;
    font-size: 11px;
    font-weight: 800;
    text-decoration: none;
    cursor: pointer;

    &:hover {
        border-color: ${({ theme }) => theme.colors.accent.success}70;
        background: ${({ theme }) => theme.colors.accent.success}20;
    }
`;

export const DetailContent = styled.div`
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 16px;
    flex: 1;
    min-height: 0;
    overflow: hidden;

    @media (max-width: 760px) {
        grid-template-columns: 1fr;
        overflow-y: auto;
    }
`;

export const DetailGroup = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    padding: 14px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    border-radius: ${({ theme }) => theme.radius.lg};
    background: ${({ theme }) => theme.colors.bg.secondary};
`;

export const DetailGroupHeader = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    margin-bottom: 4px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: 14px;
    font-weight: 800;

    small {
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
        font-weight: 700;
    }
`;

export const DetailGroupBody = styled.div`
    display: flex;
    flex-direction: column;
    gap: 8px;
    min-height: 0;
    overflow-y: auto;
    padding-right: 4px;

    @media (max-width: 760px) {
        overflow: visible;
        padding-right: 0;
    }
`;

export const DetailItem = styled.div`
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 12px;
    padding: 12px;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.bg.primary};

    strong {
        display: block;
        color: ${({ theme }) => theme.colors.text.primary};
        font-size: 13px;
    }

    small {
        display: block;
        margin-top: 3px;
        color: ${({ theme }) => theme.colors.text.tertiary};
        font-size: 11px;
    }
`;

export const ItemActions = styled.div`
    display: inline-flex;
    align-items: center;
    gap: 8px;
    flex-shrink: 0;
`;

export const InlineError = styled.div`
    padding: 10px 12px;
    border: 1px solid ${({ theme }) => theme.colors.accent.error}40;
    border-radius: ${({ theme }) => theme.radius.md};
    background: ${({ theme }) => theme.colors.accent.errorBg};
    color: ${({ theme }) => theme.colors.accent.error};
    font-size: 13px;
`;

