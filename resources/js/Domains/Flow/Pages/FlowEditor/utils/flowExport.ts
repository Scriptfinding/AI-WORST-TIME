import { csrfHeaders } from '@/Shared/Utils/csrf';
import { buildLibraryCompliantCode, buildLibraryCompliantNodalGraph, buildLibraryCompliantNodalSnippet } from '@/Domains/Library/Utils/libraryCodeExport';
import { createZipBlob } from '@/Shared/Utils/zip';
import {
    compileNodalGraphToCode,
    compileNodalGraphToSnippetCode,
    normalizeNodalFunctionGraph,
    normalizeNodalGraph,
} from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import type { NodalGraph } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { FlowInputDefinition } from '@/Domains/Flow/Utils/flowInputsMetadata';

interface ExportedSnippet {
    id: Id;
    label: string;
    args: string;
    description: string | null;
    code: string;
    snippet_type: 'code' | 'nodal';
    nodal_graph: NodalGraph | null;
}

interface DownloadFlowOptions {
    flowId: Id;
    name: string;
    description: string | null;
    isNodalFlow: boolean;
    code: string;
    nodalGraph: NodalGraph;
    inputDefinitions?: FlowInputDefinition[] | null;
}

export class SnippetExportError extends Error {}
export class FlowInputExportError extends Error {}

const getFlowDownloadBaseName = (name: string, id: Id) => {
    const slugify = (value: string) => value.trim()
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');

    return slugify(name) || slugify(String(id)) || 'flow';
};

export const collectSnippetReferences = (content: string) => {
    const references = new Set<string>();
    const pattern = /(^|[^\w$])\$\$([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/g;
    let match: RegExpExecArray | null;

    while ((match = pattern.exec(content)) !== null) {
        references.add(match[2]);
    }

    return references;
};

const downloadBlob = (filename: string, blob: Blob) => {
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');

    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};

const downloadTextFile = (filename: string, content: string, mimeType: string) => {
    downloadBlob(filename, new Blob([content], { type: mimeType }));
};

const fetchSnippetExports = async (references: string[]) => {
    if (references.length === 0) return [];

    const response = await fetch('/snippets/export', {
        method: 'POST',
        headers: {
            ...csrfHeaders(),
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ references }),
    });

    if (!response.ok) {
        throw new Error('Unable to export snippets.');
    }

    return response.json() as Promise<ExportedSnippet[]>;
};

const fetchReferencedSnippets = async (code: string) => {
    const snippetsByReference = new Map<string, ExportedSnippet>();
    const pendingReferences = collectSnippetReferences(code);

    while (pendingReferences.size > 0) {
        const references = [...pendingReferences].filter(reference => !snippetsByReference.has(reference));
        pendingReferences.clear();

        if (references.length === 0) break;

        const snippets = await fetchSnippetExports(references);
        snippets.forEach(snippet => {
            snippetsByReference.set(String(snippet.id), snippet);
            collectSnippetReferences(snippet.code).forEach(reference => {
                if (!snippetsByReference.has(reference)) {
                    pendingReferences.add(reference);
                }
            });
        });
    }

    return snippetsByReference;
};

const fetchFlowInputs = async (flowId: Id) => {
    const response = await fetch(`/flows/${flowId}/export-inputs`);
    if (!response.ok) {
        throw new FlowInputExportError('Unable to download flow inputs.');
    }

    const result = await response.json() as { inputs?: unknown };
    if (!result.inputs || typeof result.inputs !== 'object' || Array.isArray(result.inputs)) {
        return {};
    }

    return result.inputs as Record<string, unknown>;
};

export const downloadFlow = async ({
    flowId,
    name,
    description,
    isNodalFlow,
    code,
    nodalGraph,
    inputDefinitions,
}: DownloadFlowOptions) => {
    const baseName = getFlowDownloadBaseName(name, flowId);
    const baseExtension = isNodalFlow ? 'json' : 'js';
    const currentNodalGraph = normalizeNodalGraph(nodalGraph);
    const inputs = await fetchFlowInputs(flowId);
    const baseContent = isNodalFlow
        ? buildLibraryCompliantNodalGraph({
            title: name,
            description,
            inputs,
            inputDefinitions,
            graph: currentNodalGraph,
        })
        : buildLibraryCompliantCode({
            title: name,
            description,
            inputs,
            inputDefinitions,
            code,
        });
    const codeContent = isNodalFlow ? compileNodalGraphToCode(currentNodalGraph) : code;
    const baseFilename = `${baseName}.${baseExtension}`;
    let snippetsByReference: Map<string, ExportedSnippet>;
    try {
        snippetsByReference = await fetchReferencedSnippets(codeContent);
    } catch {
        throw new SnippetExportError('Unable to export snippets.');
    }

    if (snippetsByReference.size === 0) {
        downloadTextFile(
            baseFilename,
            baseContent,
            isNodalFlow ? 'application/json;charset=utf-8' : 'text/javascript;charset=utf-8',
        );
        return;
    }

    downloadBlob(`${baseName}.zip`, createZipBlob([
        { path: baseFilename, content: baseContent },
        ...[...snippetsByReference.values()].map(snippet => {
            const isNodalSnippet = snippet.snippet_type === 'nodal' && snippet.nodal_graph;
            if (isNodalSnippet) {
                const graph = normalizeNodalFunctionGraph(snippet.nodal_graph!);
                return {
                    path: `snippets/${snippet.id}.json`,
                    content: buildLibraryCompliantNodalSnippet({
                        title: snippet.label,
                        description: snippet.description,
                        args: snippet.args,
                        graph,
                        code: compileNodalGraphToSnippetCode(graph, snippet.args),
                    }),
                };
            }

            return {
                path: `snippets/${snippet.id}.js`,
                content: buildLibraryCompliantCode({
                    title: snippet.label,
                    description: snippet.description,
                    args: snippet.args,
                    code: snippet.code,
                }),
            };
        }),
    ]));
};
