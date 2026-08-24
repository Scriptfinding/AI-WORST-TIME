import { css } from 'styled-components';

export const codeGizmoStyles = css`
    .nop-code-gizmo,
    .nop-code-gizmo-favicon {
        box-sizing: border-box;
        width: 18px !important;
        height: 18px !important;
        margin: 1px auto 0;
        border-radius: 50%;
        background-position: center;
        background-repeat: no-repeat;
    }

    .nop-code-gizmo {
        transform: translateX(4px);
        border: none;
        background-color: #fff;
        background-size: 16px 16px;
        box-shadow: 0 0 0 2px ${({ theme }) => theme.colors.bg.primary};
        z-index: 1;
    }

    .nop-code-gizmo-selector,
    .nop-code-gizmo-favicon {
        transform: translateX(8px);
    }

    .nop-code-gizmo-favicon {
        border: none;
        background-color: ${({ theme }) => theme.colors.bg.secondary};
        background-size: 18px 18px;
        box-shadow: 0 0 0 1px ${({ theme }) => theme.colors.border.default};
        z-index: 2;
    }
`;
