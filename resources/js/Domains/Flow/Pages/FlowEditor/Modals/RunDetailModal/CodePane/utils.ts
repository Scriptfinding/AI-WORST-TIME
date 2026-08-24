import type { Flow, FlowRun } from '@/Domains/Flow/types';

export const getRunDetailPreviewFlow = (
    source: Flow | FlowRun['flow'] | null | undefined,
): Flow | null => {
    if (!source) return null;

    const fullSource = source as Partial<Flow>;
    return {
        ...source,
        default_inputs: fullSource.default_inputs ?? null,
        latest_run: fullSource.latest_run ?? null,
        viewport_width: fullSource.viewport_width ?? null,
        viewport_height: fullSource.viewport_height ?? null,
        keyboard_speed: fullSource.keyboard_speed ?? null,
        flow_type: fullSource.flow_type ?? 'nodal',
        nodal_graph: fullSource.nodal_graph ?? null,
    } as Flow;
};
