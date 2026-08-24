import type { VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { FormDataConvertible } from '@inertiajs/core';
import {
    inputDefinitionsToDefaults,
    parseCodeInputDefinitions,
    parseNodalInputDefinitions,
} from '@/Domains/Flow/Utils/flowInputsMetadata';

export type ParsedFlowFile = {
    code: string;
    flowType: 'code' | 'nodal';
    nodalGraph: { nodes: FormDataConvertible[]; edges: FormDataConvertible[] } | null;
};

function isFormDataConvertible(value: unknown): value is FormDataConvertible {
    if (
        value === null
        || value === undefined
        || typeof value === 'string'
        || typeof value === 'number'
        || typeof value === 'boolean'
    ) {
        return true;
    }

    if (Array.isArray(value)) {
        return value.every(isFormDataConvertible);
    }

    return typeof value === 'object'
        && Object.values(value).every(isFormDataConvertible);
}

export function baseNameFromFile(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, '');
}

export function titleFromBaseName(baseName: string) {
    const words = baseName
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!words) return 'Imported Flow';

    return words.replace(/\b\w/g, match => match.toUpperCase());
}

export function metadataFromCode(code: string) {
    const metadata: {
        title?: string;
        description?: string;
        defaultInputs?: Record<string, unknown>;
    } = {};

    for (const rawLine of code.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (!line.startsWith('//')) break;

        const match = line.match(/^\/\/\s*@(title|description)\s+(.+)$/i);
        if (match) {
            metadata[match[1].toLowerCase() as 'title' | 'description'] = match[2].trim();
        }
    }

    const inputs = inputDefinitionsToDefaults(parseCodeInputDefinitions(code));
    if (Object.keys(inputs).length > 0) {
        metadata.defaultInputs = inputs;
    }

    return metadata;
}

export function metadataFromJson(content: string) {
    try {
        const decoded = JSON.parse(content) as unknown;
        if (!decoded || typeof decoded !== 'object') return {};

        const root = decoded as { metadata?: unknown; store?: unknown; library?: unknown; title?: unknown; description?: unknown };
        const candidates = [root.metadata, root.store, root.library, root];
        const metadata = candidates.find(candidate => (
            candidate &&
            typeof candidate === 'object' &&
            (
                typeof (candidate as { title?: unknown }).title === 'string' ||
                typeof (candidate as { description?: unknown }).description === 'string'
            )
        )) as { title?: unknown; description?: unknown } | undefined;

        const inputs = inputDefinitionsToDefaults(parseNodalInputDefinitions(root.metadata));

        return {
            title: typeof metadata?.title === 'string' ? metadata.title.trim() : undefined,
            description: typeof metadata?.description === 'string' ? metadata.description.trim() : undefined,
            defaultInputs: Object.keys(inputs).length > 0 ? inputs : undefined,
        };
    } catch {
        return {};
    }
}

export function labelFromCode(code: string, fallback: string) {
    const firstComment = code
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => line.startsWith('//') && !line.match(/^\/\/\s*@/));

    return firstComment ? firstComment.replace(/^\/\/\s?/, '').trim() || fallback : fallback;
}

export function nodalGraphFromJson(decoded: unknown) {
    if (!decoded || typeof decoded !== 'object') return null;

    const root = decoded as {
        nodes?: unknown;
        edges?: unknown;
        graph?: unknown;
        nodal_graph?: unknown;
        nodalGraph?: unknown;
    };
    const candidates = [root, root.graph, root.nodal_graph, root.nodalGraph];

    for (const candidate of candidates) {
        const nodes = (candidate as { nodes?: unknown } | null)?.nodes;
        const edges = (candidate as { edges?: unknown } | null)?.edges;
        if (
            candidate &&
            typeof candidate === 'object' &&
            Array.isArray(nodes) &&
            nodes.every(isFormDataConvertible) &&
            Array.isArray(edges) &&
            edges.every(isFormDataConvertible)
        ) {
            return { nodes, edges };
        }
    }

    return null;
}

export function parseFlowFile(content: string, fileName: string): ParsedFlowFile {
    if (fileName.toLowerCase().endsWith('.json')) {
        const decoded = JSON.parse(content) as unknown;
        const nodalGraph = nodalGraphFromJson(decoded);

        if (nodalGraph) {
            return {
                code: '',
                flowType: 'nodal',
                nodalGraph,
            };
        }

        throw new Error('JSON flow files must contain nodes and edges arrays, either at the root or under graph.');
    }

    return {
        code: content.replace(/\s*$/, '\n'),
        flowType: 'code',
        nodalGraph: null,
    };
}

export function buildInitialVisibility(
    defaultVisibility: VisibilityPickerValue['visibility'],
    defaultFolderId: Id | null,
    defaultTeamId: Id | null,
): VisibilityPickerValue {
    return {
        visibility: defaultVisibility,
        personalFolderId: defaultVisibility === 'owner' ? defaultFolderId : null,
        wsFolderId: defaultVisibility === 'workspace' ? defaultFolderId : null,
        teamId: defaultVisibility === 'team' ? defaultTeamId : null,
        teamFolderId: defaultVisibility === 'team' ? defaultFolderId : null,
    };
}
