import type { HelpEntryDef, NodalFlowPortDef, NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';

export interface FlowParameterDefinition {
    argument: string;
    path: string[];
    meta: NodalParamDef;
    portId: string;
    label: string;
}

export interface NodeFlowPortDefinition extends NodalFlowPortDef {
    parameter?: FlowParameterDefinition;
}

const stableHash = (value: string) => {
    let hash = 2166136261;
    for (const character of value) {
        hash ^= character.codePointAt(0) ?? 0;
        hash = Math.imul(hash, 16777619);
    }

    return (hash >>> 0).toString(36);
};

/**
 * Mirrors NodalCatalogService::flowPortId() in
 * app/Services/Flow/NodalCatalogService.php. Both implementations must
 * produce identical port ids.
 */
export const getFlowParameterPortId = (path: string[]) => {
    const slug = path
        .join('-')
        .replace(/[^A-Za-z0-9_-]+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');
    const base = `flow-${slug || 'callback'}`;
    if (base.length <= 64) return base;

    const hash = stableHash(base);
    return `${base.slice(0, 63 - hash.length)}-${hash}`;
};

export const getFlowParameterDefinitions = (entry?: HelpEntryDef): FlowParameterDefinition[] => {
    if (!entry?.nodalParams) return [];

    const definitions: FlowParameterDefinition[] = [];
    const visit = (argument: string, path: string[], meta: NodalParamDef) => {
        if (meta.valueType === 'flow') {
            definitions.push({
                argument,
                path,
                meta,
                portId: getFlowParameterPortId(path),
                label: meta.label ?? path[path.length - 1] ?? argument,
            });
            return;
        }

        Object.entries(meta.objectFields ?? {}).forEach(([key, fieldMeta]) => {
            visit(argument, [...path, key], fieldMeta);
        });
    };

    Object.entries(entry.nodalParams).forEach(([argument, meta]) => {
        visit(argument, [argument], meta);
    });

    return definitions;
};

export const getNodeFlowPortDefinitions = (entry?: HelpEntryDef): NodeFlowPortDefinition[] => {
    if (entry?.nodalFlowPorts) return entry.nodalFlowPorts;

    const callbackPorts = getFlowParameterDefinitions(entry).map(parameter => ({
        id: parameter.portId,
        label: parameter.label,
        kind: 'callback' as const,
        parameter,
    }));

    return [
        {
            id: 'output',
            label: callbackPorts.length > 0 ? 'Continue' : 'Output',
            kind: 'continuation',
        },
        ...callbackPorts,
    ];
};

export const isCallbackFlowPort = (
    definition: NodeFlowPortDefinition,
): definition is NodeFlowPortDefinition & { kind: 'callback'; parameter: FlowParameterDefinition } => (
    definition.kind === 'callback' && definition.parameter !== undefined
);
