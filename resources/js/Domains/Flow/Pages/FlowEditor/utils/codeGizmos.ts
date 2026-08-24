import { parse } from 'acorn';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import {
    getGotoCodeSites,
    normalizeHttpUrl,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/site';
import { HELP_ENTRIES } from './helpCatalog';
import { getHelpCategoryColor, getHelpIcon } from './helpToolbox';

export interface CodeGizmo {
    kind: 'helper' | 'selector';
    lineNumber: number;
    name: string;
    description: string;
    icon: string;
    color: string;
    faviconUrl?: string;
    siteHostname?: string;
    argumentStart?: number;
    argumentEnd?: number;
    targetUrl?: string;
}

const HELP_ENTRY_BY_NAME = new Map<string, HelpEntryDef>();

HELP_ENTRIES.forEach(entry => {
    if (!HELP_ENTRY_BY_NAME.has(entry.name)) HELP_ENTRY_BY_NAME.set(entry.name, entry);
});

const getHelperCallsByLine = (code: string) => {
    const calls = new Map<number, string>();
    let quote: "'" | '"' | '`' | null = null;
    let inBlockComment = false;
    let escaped = false;

    code.split('\n').forEach((line, lineIndex) => {
        for (let index = 0; index < line.length; index += 1) {
            const character = line[index];
            const nextCharacter = line[index + 1];

            if (inBlockComment) {
                if (character === '*' && nextCharacter === '/') {
                    inBlockComment = false;
                    index += 1;
                }
                continue;
            }

            if (quote) {
                if (escaped) {
                    escaped = false;
                } else if (character === '\\') {
                    escaped = true;
                } else if (character === quote) {
                    quote = null;
                }
                continue;
            }

            if (character === '/' && nextCharacter === '/') break;
            if (character === '/' && nextCharacter === '*') {
                inBlockComment = true;
                index += 1;
                continue;
            }
            if (character === "'" || character === '"' || character === '`') {
                quote = character;
                continue;
            }
            if (character !== '$') continue;

            const match = line.slice(index).match(/^\$\$?[A-Za-z_][A-Za-z0-9_]*/);
            const name = match?.[0];
            if (!name || (!name.startsWith('$$') && !HELP_ENTRY_BY_NAME.has(name))) continue;

            let cursor = index + name.length;
            while (/\s/.test(line[cursor] ?? '')) cursor += 1;
            if (line[cursor] !== '(') continue;

            calls.set(lineIndex + 1, name);
            break;
        }
    });

    return calls;
};

interface SyntaxNode {
    type: string;
    start: number;
    end: number;
    loc?: { start: { line: number } };
    [key: string]: unknown;
}

const walkSyntax = (
    value: unknown,
    visit: (node: SyntaxNode, parent?: SyntaxNode) => void,
    parent?: SyntaxNode,
) => {
    if (!value || typeof value !== 'object') return;
    const node = value as Partial<SyntaxNode>;
    if (typeof node.type === 'string' && typeof node.start === 'number' && typeof node.end === 'number') {
        visit(node as SyntaxNode, parent);
    }
    Object.entries(value).forEach(([key, child]) => {
        if (['loc', 'start', 'end'].includes(key)) return;
        if (Array.isArray(child)) child.forEach(item => walkSyntax(item, visit, node as SyntaxNode));
        else walkSyntax(child, visit, node as SyntaxNode);
    });
};

const FUNCTION_SCOPE_TYPES = new Set([
    'FunctionDeclaration',
    'FunctionExpression',
    'ArrowFunctionExpression',
]);

const getSignatureArgs = (entry: HelpEntryDef) => (
    entry.signature.match(/\((.*)\)/)?.[1]
        ?.split(',')
        .map(argument => argument.trim().replace(/\?$/, '').replace(/^\.\.\./, ''))
        ?? []
);

const getStaticString = (node: SyntaxNode | null | undefined) => {
    if (node?.type === 'Literal' && typeof node.value === 'string') return node.value;
    if (
        node?.type === 'TemplateLiteral'
        && Array.isArray(node.expressions)
        && node.expressions.length === 0
        && Array.isArray(node.quasis)
    ) {
        const quasi = node.quasis[0] as SyntaxNode | undefined;
        const value = quasi?.value as { cooked?: unknown } | undefined;
        return typeof value?.cooked === 'string' ? value.cooked : null;
    }

    return null;
};

const getObjectPropertyName = (property: SyntaxNode) => {
    if (property.type !== 'Property' || property.kind !== 'init' || property.method === true) {
        return null;
    }

    const key = property.key as SyntaxNode | undefined;
    if (property.computed !== true && key?.type === 'Identifier' && typeof key.name === 'string') {
        return key.name;
    }
    if (key?.type === 'Literal' && typeof key.value === 'string') return key.value;
    return null;
};

const getObjectPathValue = (root: SyntaxNode | undefined, path: string[]) => {
    let current = root;
    for (const segment of path) {
        if (current?.type !== 'ObjectExpression' || !Array.isArray(current.properties)) return null;
        const properties = current.properties as SyntaxNode[];
        if (properties.some(property => property.type === 'SpreadElement')) return null;

        const property = [...properties]
            .reverse()
            .find(candidate => getObjectPropertyName(candidate) === segment);
        current = property?.value as SyntaxNode | undefined;
        if (!current) return null;
    }

    return current ?? null;
};

const getCallPathValue = (
    call: SyntaxNode,
    entry: HelpEntryDef,
    path: string[],
) => {
    const [argumentName, ...segments] = path;
    if (!argumentName || argumentName === 'output') return null;

    const argumentIndex = getSignatureArgs(entry).indexOf(argumentName);
    const args = call.arguments as SyntaxNode[] | undefined;
    if (argumentIndex < 0 || !args?.[argumentIndex]) return null;

    return getObjectPathValue(args[argumentIndex], segments);
};

const resolveCallSiteUrl = (
    call: SyntaxNode,
    entry: HelpEntryDef,
    urlPaths: string[][],
) => {
    for (const path of urlPaths) {
        const value = getStaticString(getCallPathValue(call, entry, path));
        const url = value ? normalizeHttpUrl(value) : null;
        if (url) return url;
    }

    return null;
};

interface SiteContextEvent {
    position: number;
    url: string | null;
}

const getSelectorGizmos = (code: string): CodeGizmo[] => {
    try {
        const ast = parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'script',
            locations: true,
            allowAwaitOutsideFunction: true,
        }) as unknown as SyntaxNode;
        const parents = new Map<SyntaxNode, SyntaxNode>();
        const nodes: SyntaxNode[] = [];
        walkSyntax(ast, (node, parent) => {
            nodes.push(node);
            if (parent) parents.set(node, parent);
        });

        const getScope = (node: SyntaxNode | undefined): SyntaxNode | null => {
            let current = node;
            while (current) {
                if (current.type === 'Program' || FUNCTION_SCOPE_TYPES.has(current.type)) return current;
                current = parents.get(current);
            }
            return null;
        };
        const siteEvents = new Map<SyntaxNode, SiteContextEvent[]>();
        const callbackContexts = new Map<SyntaxNode, string | null>();
        const addSiteEvent = (scope: SyntaxNode | null, event: SiteContextEvent) => {
            if (!scope) return;
            siteEvents.set(scope, [...(siteEvents.get(scope) ?? []), event]);
        };

        nodes.forEach(node => {
            if (node.type !== 'CallExpression') return;
            const callee = node.callee as SyntaxNode | undefined;
            const args = node.arguments as SyntaxNode[] | undefined;
            if (callee?.type !== 'Identifier' || !args || typeof callee.name !== 'string') return;

            const entry = HELP_ENTRY_BY_NAME.get(callee.name);
            const scope = getScope(node);
            if (!entry?.siteUrlContexts) return;

            entry.siteUrlContexts.forEach(context => {
                const url = resolveCallSiteUrl(node, entry, context.urlPaths);
                if (context.contextPath.length === 1 && context.contextPath[0] === 'output') {
                    addSiteEvent(scope, { position: node.end, url });
                    return;
                }

                const callback = getCallPathValue(node, entry, context.contextPath);
                if (callback && FUNCTION_SCOPE_TYPES.has(callback.type)) {
                    callbackContexts.set(callback, url);
                }
            });
        });
        siteEvents.forEach(events => events.sort((left, right) => left.position - right.position));

        const resolveTargetUrl = (selector: SyntaxNode) => {
            let scope = getScope(selector);
            let boundary = selector.start;

            while (scope) {
                const precedingEvent = [...(siteEvents.get(scope) ?? [])]
                    .reverse()
                    .find(event => event.position < boundary);
                if (precedingEvent) return precedingEvent.url ?? undefined;
                if (callbackContexts.has(scope)) return callbackContexts.get(scope) ?? undefined;
                if (scope.type === 'Program') return undefined;

                let containingCall: SyntaxNode | undefined;
                let ancestor = parents.get(scope);
                while (ancestor) {
                    if (ancestor.type === 'CallExpression') {
                        containingCall = ancestor;
                        break;
                    }
                    if (ancestor.type === 'Program' || FUNCTION_SCOPE_TYPES.has(ancestor.type)) break;
                    ancestor = parents.get(ancestor);
                }
                if (!containingCall) return undefined;

                boundary = containingCall.start;
                scope = getScope(parents.get(containingCall));
            }

            return undefined;
        };

        const selectors: CodeGizmo[] = [];
        nodes.forEach(node => {
            if (node.type !== 'CallExpression') return;
            const callee = node.callee as SyntaxNode | undefined;
            const args = node.arguments as SyntaxNode[] | undefined;
            if (callee?.type !== 'Identifier' || !args || typeof callee.name !== 'string') return;

            const entry = HELP_ENTRY_BY_NAME.get(callee.name);
            if (!entry) return;

            getSignatureArgs(entry).forEach((argumentName, argumentIndex) => {
                if (entry.nodalParams?.[argumentName]?.picker !== 'selector') return;
                const argument = args[argumentIndex];
                if (!argument || getStaticString(argument) === null) return;
                const lineNumber = argument.loc?.start.line ?? node.loc?.start.line;
                if (!lineNumber) return;

                selectors.push({
                    kind: 'selector',
                    lineNumber,
                    name: callee.name as string,
                    description: `Grab a resilient selector for ${argumentName}.`,
                    icon: 'lucide:crosshair',
                    color: '#48c591',
                    argumentStart: argument.start,
                    argumentEnd: argument.end,
                    targetUrl: resolveTargetUrl(argument),
                });
            });
        });
        return selectors;
    } catch {
        return [];
    }
};

export const getCodeGizmos = (code: string): CodeGizmo[] => {
    const gotoSites = new Map(getGotoCodeSites(code).map(site => [site.lineNumber, site]));

    const helperGizmos: CodeGizmo[] = Array.from(getHelperCallsByLine(code), ([lineNumber, name]) => {
        const entry = HELP_ENTRY_BY_NAME.get(name) ?? {
            name,
            signature: `${name}(...)`,
            desc: `Call the ${name.slice(2)} snippet.`,
            category: 'Snippets',
        };
        const gotoSite = name === '$gotoUrl' ? gotoSites.get(lineNumber) : undefined;

        return {
            kind: 'helper' as const,
            lineNumber,
            name,
            description: entry.desc,
            icon: getHelpIcon(entry),
            color: getHelpCategoryColor(entry),
            ...(gotoSite ? {
                faviconUrl: gotoSite.faviconUrl,
                siteHostname: new URL(gotoSite.url).hostname,
                targetUrl: gotoSite.url,
            } : {}),
        };
    });
    return [...helperGizmos, ...getSelectorGizmos(code)];
};
