import type { ActionLogEntry } from '@/Domains/Flow/types';

const ACTION_GROUP_GAP_MS = 300;

export interface ActionGroup {
    start: number;
    items: ActionLogEntry[];
    sequenceId?: string;
}

export function formatTime(seconds: number): string {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

export function findActiveIndex(actions: ActionLogEntry[], currentTimeMs: number): number {
    let activeIndex = -1;

    for (let index = 0; index < actions.length; index++) {
        if (actions[index].offset_ms <= currentTimeMs) {
            activeIndex = index;
        } else {
            break;
        }
    }

    return activeIndex;
}

export function resolveActionLabel(
    label: string,
    resourceLabels: ReadonlyMap<string, string>,
): string {
    const directLabel = resourceLabels.get(label);
    if (directLabel) return directLabel;

    for (const [id, displayValue] of resourceLabels) {
        if (label.startsWith(`${id}:`)) {
            return `${displayValue}${label.slice(id.length)}`;
        }
    }

    return label;
}

export function groupActions(actions: ActionLogEntry[]): ActionGroup[] {
    const groups: ActionGroup[] = [];

    actions.forEach((action, index) => {
        const currentGroup = groups[groups.length - 1];
        if (action.sequence_id && currentGroup?.sequenceId === action.sequence_id) {
            currentGroup.items.push(action);
            return;
        }

        if (action.sequence_id) {
            groups.push({ start: index, items: [action], sequenceId: action.sequence_id });
            return;
        }

        const previousAction = index > 0 ? actions[index - 1] : null;

        if (
            !previousAction
            || previousAction.sequence_id
            || Math.abs(action.offset_ms - previousAction.offset_ms) > ACTION_GROUP_GAP_MS
        ) {
            groups.push({ start: index, items: [action] });
        } else {
            groups[groups.length - 1].items.push(action);
        }
    });

    return groups;
}
