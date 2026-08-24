import type { Flow, FlowRun } from '@/Domains/Flow/types';
import type { Workspace } from '@/Domains/Workspace/types';

type RuntimeDefaults = Pick<Workspace, 'keyboard_speed' | 'viewport_width' | 'viewport_height'>;
type FlowRuntimeOverrides = Pick<Flow, 'keyboard_speed' | 'viewport_width' | 'viewport_height'>;

export const buildRerunInput = (
    run: Pick<FlowRun, 'input'>,
    workspace: RuntimeDefaults | null,
    flow?: FlowRuntimeOverrides | null,
): string => {
    const input = run.input ? { ...run.input } : {};
    delete input['$context'];

    const defaults = {
        $keyboardSpeed: flow?.keyboard_speed ?? workspace?.keyboard_speed ?? 100,
        $viewportWidth: flow?.viewport_width ?? workspace?.viewport_width ?? 1280,
        $viewportHeight: flow?.viewport_height ?? workspace?.viewport_height ?? 720,
    };

    for (const [key, defaultValue] of Object.entries(defaults)) {
        if (Number(input[key]) === defaultValue) delete input[key];
    }

    return Object.keys(input).length > 0 ? JSON.stringify(input, null, 2) : '{}';
};
