import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    compileNodalGraphToSnippetCode,
    normalizeNodalFunctionGraph,
} from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import type { SnippetType } from '@/Domains/Snippet/types';

export interface ParsedSnippetSource {
    snippetType: SnippetType;
    code: string;
    nodalGraph: NodalGraph | null;
    metadata: { title?: string; description?: string; args?: string };
}

export function baseNameFromFile(fileName: string) {
    return fileName.replace(/\.[^/.]+$/, '');
}

export function titleFromBaseName(baseName: string) {
    const words = baseName
        .replace(/[_-]+/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    if (!words) return 'Imported Snippet';

    return words.replace(/\b\w/g, match => match.toUpperCase());
}

export function paramNameFromDocTag(value: string) {
    const withoutType = value.trim().replace(/^\{[^}]+\}\s*/, '').replace(/^\[/, '');
    const match = withoutType.match(/^([a-zA-Z_$][a-zA-Z0-9_$]*)/);
    return match ? match[1] : null;
}

export function metadataFromCode(code: string) {
    const metadata: { title?: string; description?: string; args?: string } = {};
    const params: string[] = [];

    for (const rawLine of code.split(/\r?\n/)) {
        const line = rawLine.trim();
        if (!line) continue;
        if (!line.startsWith('//')) break;

        const textMatch = line.match(/^\/\/\s*@(title|description)\s+(.+)$/i);
        if (textMatch) {
            metadata[textMatch[1].toLowerCase() as 'title' | 'description'] = textMatch[2].trim();
            continue;
        }

        const paramMatch = line.match(/^\/\/\s*@param\s+(.+)$/i);
        if (paramMatch) {
            const param = paramNameFromDocTag(paramMatch[1]);
            if (param && !params.includes(param)) params.push(param);
        }
    }

    if (params.length > 0) {
        metadata.args = params.join(', ');
    }

    return metadata;
}

export function labelFromCode(code: string, fallback: string) {
    const firstComment = code
        .split(/\r?\n/)
        .map(line => line.trim())
        .find(line => line.startsWith('//') && !line.match(/^\/\/\s*@/));

    return firstComment ? firstComment.replace(/^\/\/\s?/, '').trim() || fallback : fallback;
}

const isRecord = (value: unknown): value is Record<string, unknown> => (
    typeof value === 'object' && value !== null && !Array.isArray(value)
);

const graphFromEnvelope = (value: Record<string, unknown>): NodalGraph | null => {
    for (const key of ['graph', 'nodal_graph', 'nodalGraph']) {
        const graph = value[key];
        if (isRecord(graph) && Array.isArray(graph.nodes) && Array.isArray(graph.edges)) {
            return graph as unknown as NodalGraph;
        }
    }

    if (Array.isArray(value.nodes) && Array.isArray(value.edges)) {
        return value as unknown as NodalGraph;
    }

    return null;
};

const stringValue = (value: unknown) => typeof value === 'string' ? value.trim() : '';

export function parseSnippetSource(content: string, fileName: string): ParsedSnippetSource {
    if (!fileName.toLowerCase().endsWith('.json')) {
        return {
            snippetType: 'code',
            code: content.replace(/\s*$/, '\n'),
            nodalGraph: null,
            metadata: metadataFromCode(content),
        };
    }

    let decoded: unknown;
    try {
        decoded = JSON.parse(content);
    } catch {
        throw new Error('The selected JSON file is not valid JSON.');
    }
    if (!isRecord(decoded)) {
        throw new Error('The selected JSON file does not contain a nodal snippet.');
    }
    if (decoded.format !== undefined && decoded.format !== 'puppetflow.snippet') {
        throw new Error('This JSON file is not a Puppetflow snippet.');
    }
    if (decoded.format_version !== undefined && decoded.format_version !== 1) {
        throw new Error('This snippet format version is not supported.');
    }
    if (decoded.compiler_version !== undefined && ![1, 2].includes(Number(decoded.compiler_version))) {
        throw new Error('This snippet compiler version is not supported.');
    }
    if (decoded.snippet_type !== undefined && decoded.snippet_type !== 'nodal') {
        throw new Error('Only nodal snippets can be imported from JSON.');
    }

    const graph = graphFromEnvelope(decoded);
    if (!graph) {
        throw new Error('The JSON snippet must contain a graph with nodes and edges.');
    }

    const metadata = isRecord(decoded.metadata) ? decoded.metadata : {};
    const rawArgs = metadata.args;
    const args = Array.isArray(rawArgs)
        ? rawArgs.filter((arg): arg is string => typeof arg === 'string').map(arg => arg.trim()).filter(Boolean).join(', ')
        : stringValue(rawArgs);
    const compiledCode = stringValue(decoded.compiled_code ?? decoded.compiledCode ?? decoded.code);
    if (!compiledCode) {
        throw new Error('The nodal snippet must contain compiled_code.');
    }
    const normalizedGraph = normalizeNodalFunctionGraph(graph);
    const normalizedCode = compileNodalGraphToSnippetCode(normalizedGraph, args);

    return {
        snippetType: 'nodal',
        code: `${normalizedCode.replace(/\s*$/, '')}\n`,
        nodalGraph: normalizedGraph,
        metadata: {
            title: stringValue(metadata.title) || undefined,
            description: stringValue(metadata.description) || undefined,
            args: args || undefined,
        },
    };
}
