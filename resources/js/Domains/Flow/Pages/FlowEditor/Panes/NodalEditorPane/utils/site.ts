import type { CanvasNode } from '../types';
import { getNodeFlowPortDefinitions } from './flowParameters';

export interface GotoCodeSite {
    lineNumber: number;
    url: string;
    faviconUrl: string;
}

export const normalizeHttpUrl = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed || trimmed.includes('{{')) return null;

    try {
        const url = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
        if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
        return url.href;
    } catch {
        return null;
    }
};

export const getSiteFaviconUrl = (value: string) => {
    const url = normalizeHttpUrl(value);
    if (!url) return null;

    return `https://www.google.com/s2/favicons?domain_url=${encodeURIComponent(new URL(url).origin)}&sz=64`;
};

const getFixedNodeValueAtPath = (node: CanvasNode, path: string[]) => {
    const [rootKey, ...segments] = path;
    if (!rootKey) return null;

    let current: unknown = node.values[rootKey];
    for (const segment of segments) {
        if (!current || typeof current !== 'object' || Array.isArray(current)) return null;

        const record = current as Record<string, unknown>;
        if (record.mode === 'object') {
            if (record.inputMode === 'form') {
                const fields = Array.isArray(record.fields)
                    ? record.fields as Array<Record<string, unknown>>
                    : [];
                current = fields.find(field => field.key === segment)?.value;
                continue;
            }
            if (record.inputMode === 'json' && record.jsonMode !== 'expression') {
                try {
                    const parsed: unknown = JSON.parse(
                        typeof record.value === 'string' ? record.value : '{}',
                    );
                    current = parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                        ? (parsed as Record<string, unknown>)[segment]
                        : null;
                } catch {
                    return null;
                }
                continue;
            }
        }

        current = record[segment];
    }

    if (typeof current === 'string') return current;
    if (!current || typeof current !== 'object' || Array.isArray(current)) return null;

    const scalar = current as Record<string, unknown>;
    return scalar.mode === 'fixed' && typeof scalar.value === 'string'
        ? scalar.value
        : null;
};

export const getNodeSiteUrl = (
    node: CanvasNode | undefined,
    sourcePort = 'output',
) => {
    if (!node) return null;

    const portDefinition = getNodeFlowPortDefinitions(node.entry)
        .find(definition => definition.id === sourcePort);
    const contextPath = portDefinition?.parameter?.path
        ?? (
            portDefinition?.kind === 'continuation' || sourcePort === 'output'
                ? ['output']
                : null
        );
    if (!contextPath) return null;

    const context = node.entry.siteUrlContexts?.find(definition => (
        definition.contextPath.length === contextPath.length
        && definition.contextPath.every((segment, index) => segment === contextPath[index])
    ));
    if (!context) return null;

    for (const path of context.urlPaths) {
        const value = getFixedNodeValueAtPath(node, path);
        const url = value ? normalizeHttpUrl(value) : null;
        if (url) return url;
    }

    return null;
};

const decodeStringLiteral = (value: string, quote: string) => {
    if (quote === '"') return JSON.parse(`"${value}"`);

    return value.replace(/\\([\s\S])/g, (_match, escaped: string) => {
        const escapedCharacters: Record<string, string> = {
            b: '\b',
            f: '\f',
            n: '\n',
            r: '\r',
            t: '\t',
            v: '\v',
        };

        return escapedCharacters[escaped] ?? escaped;
    });
};

export const getGotoCodeSites = (code: string): GotoCodeSite[] => {
    return code.split('\n').flatMap((line, index) => {
        const match = line.match(/(?:\bawait\s+)?\$gotoUrl\(\s*(["'`])((?:\\.|(?!\1)[^\\])*)\1/);
        if (!match?.[1] || match[2] == null) return [];

        try {
            const url = normalizeHttpUrl(decodeStringLiteral(match[2], match[1]));
            const faviconUrl = url ? getSiteFaviconUrl(url) : null;
            return url && faviconUrl ? [{ lineNumber: index + 1, url, faviconUrl }] : [];
        } catch {
            return [];
        }
    });
};
