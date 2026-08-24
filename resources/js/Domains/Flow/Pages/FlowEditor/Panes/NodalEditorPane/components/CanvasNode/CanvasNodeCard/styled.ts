import styled from 'styled-components';

export const CanvasNode = styled.div<{ $selected?: boolean; $invalid?: boolean }>`
    position: absolute;
    width: 118px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
    transform: translate(-50%, -50%);
    overflow: visible;
    cursor: grab;
    z-index: 2;

    &:active {
        cursor: grabbing;
    }
`;

export const NodeValidationBadge = styled.div`
    position: absolute;
    top: -6px;
    right: calc(50% - 45px);
    width: 20px;
    height: 20px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border-radius: 999px;
    border: 2px solid ${({ theme }) => theme.colors.bg.primary};
    color: white;
    background: #ef4444;
    box-shadow: 0 0 0 2px #ef444433, ${({ theme }) => theme.shadow.sm};
    z-index: 9;
    pointer-events: auto;
`;

export const NodeSiteBadge = styled.a`
    position: absolute;
    top: -6px;
    right: calc(50% - 45px);
    width: 22px;
    height: 22px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    overflow: hidden;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.colors.bg.primary};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border.default}, ${({ theme }) => theme.shadow.sm};
    z-index: 9;
    pointer-events: auto;
    cursor: pointer;

    img {
        position: absolute;
        inset: 0px;
        width: 18px;
        height: 18px;
        border-radius: 3px;
        object-fit: contain;
    }
`;

export const NodeHoverActions = styled.div`
    position: absolute;
    left: 50%;
    top: -22px;
    display: flex;
    align-items: center;
    gap: 2px;
    padding: 2px;
    transform: translateX(-50%);
    border-radius: 999px;
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast};
    z-index: 8;

    ${CanvasNode}:hover & {
        opacity: 1;
        pointer-events: auto;
    }
`;

export const NodeRunAction = styled.button`
    position: absolute;
    right: calc(50% + 50px);
    top: 36px;
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 7px 10px;
    transform: translateY(-50%);
    border-radius: ${({ theme }) => theme.radius.md};
    border: 1px solid ${({ theme }) => theme.colors.brand};
    color: white;
    background: ${({ theme }) => theme.colors.brand};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    font-size: 11px;
    font-weight: 700;
    white-space: nowrap;
    cursor: pointer;
    opacity: 0;
    pointer-events: none;
    transition: opacity ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};
    z-index: 9;

    ${CanvasNode}:hover &,
    ${CanvasNode}[data-selected='true'] & {
        opacity: 1;
        pointer-events: auto;
    }

    &:hover {
        filter: brightness(1.05);
    }
`;

export const NodeTile = styled.div`
    width: 72px;
    height: 72px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.lg};
    border: 1px solid ${({ theme }) => theme.colors.border.default};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.md};
    pointer-events: none;

    ${CanvasNode}[data-node-card]:hover &,
    ${CanvasNode}[data-node-card][data-selected='true'] & {
        border-color: ${({ theme }) => theme.colors.border.light};
    }

    ${CanvasNode}[data-node-card][data-invalid='true'] & {
        border-width: 2px;
        border-color: #ef4444;
        box-shadow: 0 0 0 3px #ef444433, ${({ theme }) => theme.shadow.md};
    }

    ${CanvasNode}[data-node-card][data-selected='true'] & {
        border-width: 2px;
        border-color: #22c55e;
        box-shadow: 0 0 0 3px #22c55e33, ${({ theme }) => theme.shadow.md};
    }

    ${CanvasNode}[data-node-card][data-selection-preview='true'] & {
        border-width: 2px;
        border-color: ${({ theme }) => theme.colors.border.light};
        box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.border.default}, ${({ theme }) => theme.shadow.md};
    }

    ${CanvasNode}[data-node-card][data-run-active='true'] & {
        border-width: 2px;
        border-color: #22c55e;
        box-shadow: 0 0 0 3px #22c55e40, 0 0 18px #22c55e26, ${({ theme }) => theme.shadow.md};
        animation: node-run-active-breathe 1.55s ease-in-out infinite;
    }

    ${CanvasNode}[data-node-card][data-run-error='true'] & {
        border-width: 2px;
        border-color: #ef4444;
        box-shadow: 0 0 0 4px #ef444433, ${({ theme }) => theme.shadow.md};
        animation: none;
    }

    @keyframes node-run-active-breathe {
        0%, 100% {
            border-color: #22c55e;
            box-shadow: 0 0 0 3px #22c55e33, 0 0 10px #22c55e1f, ${({ theme }) => theme.shadow.md};
        }
        50% {
            border-color: #86efac;
            box-shadow: 0 0 0 8px #22c55e16, 0 0 24px #22c55e45, ${({ theme }) => theme.shadow.md};
        }
    }
`;

export const NodeIcon = styled.div<{ $color?: string }>`
    width: 48px;
    height: 48px;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: ${({ theme }) => theme.radius.md};
    color: ${({ $color, theme }) => $color || theme.colors.accent.primary};
    background: ${({ $color, theme }) => ($color || theme.colors.accent.primary)}18;
    flex-shrink: 0;

    ${CanvasNode}[data-deactivated='true'] & {
        filter: grayscale(1);
        opacity: 0.58;
    }
`;

export const NodeLabel = styled.div`
    width: 118px;
    min-height: 32px;
    text-align: center;
    font-size: 12px;
    line-height: 16px;
    font-weight: 600;
    color: ${({ theme }) => theme.colors.text.primary};
    word-break: break-word;
    pointer-events: none;

    ${CanvasNode}[data-deactivated='true'] & {
        color: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const NodeLabelText = styled.span`
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
`;

export const NodeDeactivatedLabel = styled.span`
    display: block;
`;

export const NodeHint = styled.div`
    position: absolute;
    top: 100px;
    left: 50%;
    width: 150px;
    transform: translateX(-50%);
    text-align: center;
    font-size: 10px;
    line-height: 14px;
    font-weight: 500;
    color: ${({ theme }) => theme.colors.text.tertiary};
    pointer-events: none;
`;

export const NodeHandle = styled.div<{ $right?: boolean; $side?: 'input' | 'output'; $index?: number; $count?: number }>`
    position: absolute;
    top: ${({ $index = 0, $count = 1 }) => 36 + ($index - ($count - 1) / 2) * 20}px;
    ${({ $right, $side }) => ($right || $side === 'output' ? 'right: calc(50% - 44px);' : 'left: calc(50% - 44px);')}
    transform: translateY(-50%);
    width: 16px;
    height: 16px;
    border-radius: 50%;
    border: 2px solid ${({ theme }) => theme.colors.border.light};
    background: ${({ theme }) => theme.colors.bg.primary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    cursor: crosshair;
    z-index: 2;
    transition: transform ${({ theme }) => theme.transition.fast}, background ${({ theme }) => theme.transition.fast};

    &:hover {
        transform: translateY(-50%) scale(1.25);
        background: ${({ theme }) => theme.colors.text.tertiary};
    }
`;

export const NodeHandleLabel = styled.span`
    position: absolute;
    left: 20px;
    top: 50%;
    transform: translateY(-50%);
    padding: 2px 5px;
    border-radius: ${({ theme }) => theme.radius.sm};
    color: ${({ theme }) => theme.colors.text.tertiary};
    background: ${({ theme }) => theme.colors.bg.secondary};
    box-shadow: ${({ theme }) => theme.shadow.sm};
    font-size: 9px;
    line-height: 1;
    font-weight: 600;
    white-space: nowrap;
    pointer-events: none;
    user-select: none;
`;
