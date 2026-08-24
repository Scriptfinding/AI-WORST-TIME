const VIEWPORT_MARGIN = 8;

export interface MenuPosition {
    left: number;
    top: number;
}

export function getMenuPosition(
    anchor: MenuPosition,
    menuSize: { width: number; height: number },
    viewportSize: { width: number; height: number },
): MenuPosition {
    const maxLeft = Math.max(VIEWPORT_MARGIN, viewportSize.width - menuSize.width - VIEWPORT_MARGIN);
    const maxTop = Math.max(VIEWPORT_MARGIN, viewportSize.height - menuSize.height - VIEWPORT_MARGIN);

    return {
        left: Math.min(Math.max(anchor.left, VIEWPORT_MARGIN), maxLeft),
        top: Math.min(Math.max(anchor.top, VIEWPORT_MARGIN), maxTop),
    };
}

export function getEnabledMenuItems(menu: HTMLElement): HTMLButtonElement[] {
    return Array.from(
        menu.querySelectorAll<HTMLButtonElement>('[role="menuitem"]:not(:disabled)'),
    ).filter(item => item.offsetParent !== null);
}
