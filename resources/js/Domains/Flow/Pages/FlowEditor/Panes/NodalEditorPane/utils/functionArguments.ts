import type { NodalGraph, NodeParameterValue, RawNodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { normalizeParameterValue, normalizeScalarParameterValue } from './expression';

export const getFunctionArgumentNames = (value: RawNodeParameterValue | undefined): string[] => {
    const normalized = normalizeParameterValue(value);

    if (normalized.mode === 'object') {
        if (normalized.inputMode === 'form') {
            return normalized.fields
                .map(field => field.key.trim())
                .filter(Boolean);
        }

        try {
            const parsed = JSON.parse(normalized.value || '{}');
            return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
                ? Object.keys(parsed)
                : [];
        } catch {
            return [];
        }
    }

    return normalizeScalarParameterValue(value).value
        .split(',')
        .map((argument: string) => argument.trim())
        .filter(Boolean);
};

export const EMPTY_FUNCTION_ARGUMENTS: NodeParameterValue = {
    mode: 'object',
    inputMode: 'form',
    jsonMode: 'fixed',
    value: '{}',
    fields: [],
};

export interface FunctionArgumentRename {
    from: string;
    to: string;
}

// Detects in-place argument renames between two argument lists. Renames can
// only be inferred positionally, so lists with different lengths (added or
// removed arguments) and reorders (an old name still present in the new list)
// yield no renames.
export const diffFunctionArgumentRenames = (previous: string[], next: string[]): FunctionArgumentRename[] => {
    if (previous.length !== next.length) return [];

    const renames = previous
        .map((from, index) => ({ from, to: next[index] }))
        .filter(({ from, to }) => from && to && from !== to);

    if (renames.some(({ from }) => next.includes(from))) return [];

    return renames;
};

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const renameInputPropertyReferences = (source: string, from: string, to: string): string => {
    const escaped = escapeRegExp(from);

    // Replacer functions keep "$" characters in argument names literal.
    return source
        .replace(new RegExp(`\\$input\\s*\\.\\s*${escaped}(?![\\w$])`, 'g'), () => `$input.${to}`)
        .replace(new RegExp(`\\$input\\[(['"])${escaped}\\1\\]`, 'g'), (_, quote: string) => `$input[${quote}${to}${quote}]`);
};

const renameIdentifierReferences = (source: string, from: string, to: string): string => {
    const withInputReferences = renameInputPropertyReferences(source, from, to);

    // Arguments are also exposed as bare identifiers in the expression scope.
    // Skip property accesses (preceded by a dot) and longer identifiers.
    return withInputReferences.replace(
        new RegExp(`(^|[^.\\w$])${escapeRegExp(from)}(?![\\w$])`, 'g'),
        (_, prefix: string) => `${prefix}${to}`,
    );
};

const renameReferencesInTemplate = (template: string, renames: FunctionArgumentRename[]): string => {
    // Bare identifier renames only apply inside {{ }} expression segments;
    // outside of them the text is plain content, where only explicit
    // $input.name references are unambiguous enough to rewrite.
    const withExpressionSegments = template.replace(
        /\{\{([\s\S]*?)\}\}/g,
        (_, expression: string) => `{{${renames.reduce(
            (result, { from, to }) => renameIdentifierReferences(result, from, to),
            expression,
        )}}}`,
    );

    return renames.reduce(
        (result, { from, to }) => renameInputPropertyReferences(result, from, to),
        withExpressionSegments,
    );
};

const renameReferencesInParameterValue = (
    value: RawNodeParameterValue,
    renames: FunctionArgumentRename[],
): RawNodeParameterValue => {
    if (typeof value === 'string') return renameReferencesInTemplate(value, renames);

    if (value.mode === 'if-condition') {
        return {
            ...value,
            rules: value.rules.map(rule => ({
                ...rule,
                left: { ...rule.left, value: renameReferencesInTemplate(rule.left.value, renames) },
                right: rule.right
                    ? { ...rule.right, value: renameReferencesInTemplate(rule.right.value, renames) }
                    : rule.right,
            })),
        };
    }

    if (value.mode === 'object') {
        return {
            ...value,
            value: renameReferencesInTemplate(value.value, renames),
            fields: value.fields.map(field => ({
                ...field,
                value: renameReferencesInParameterValue(field.value, renames) as NodeParameterValue,
            })),
        };
    }

    return { ...value, value: renameReferencesInTemplate(value.value, renames) };
};

// Rewrites expression references to renamed function arguments across all
// node parameter values of the graph. Returns the same graph instance when
// there is nothing to rename.
export const renameFunctionArgumentReferences = (
    graph: NodalGraph,
    renames: FunctionArgumentRename[],
): NodalGraph => {
    if (renames.length === 0) return graph;

    return {
        ...graph,
        nodes: graph.nodes.map(node => node.values
            ? {
                ...node,
                values: Object.fromEntries(Object.entries(node.values).map(([key, value]) => [
                    key,
                    renameReferencesInParameterValue(value, renames),
                ])),
            }
            : node),
    };
};
