import { parse } from 'acorn';
import { ASYNC_HELPER_NAMES } from './helpCatalog';

export interface MissingAwaitCall {
    name: string;
    start: number;
    lineNumber: number;
}

interface SyntaxNode {
    type: string;
    start: number;
    end: number;
    async?: boolean;
    name?: string;
    body?: SyntaxNode;
    callee?: SyntaxNode;
    loc?: { start: { line: number } };
    [key: string]: unknown;
}

const FUNCTION_NODE_TYPES = new Set([
    'ArrowFunctionExpression',
    'FunctionDeclaration',
    'FunctionExpression',
]);

function isHandledPromise(ancestors: SyntaxNode[]): boolean {
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const ancestor = ancestors[index];
        if (ancestor.type === 'AwaitExpression' || ancestor.type === 'ReturnStatement') {
            return true;
        }
        if (!FUNCTION_NODE_TYPES.has(ancestor.type)) continue;

        return ancestor.type === 'ArrowFunctionExpression'
            && ancestor.body?.type !== 'BlockStatement';
    }

    return false;
}

function isInsideNonAsyncFunction(ancestors: SyntaxNode[]): boolean {
    for (let index = ancestors.length - 1; index >= 0; index -= 1) {
        const ancestor = ancestors[index];
        if (FUNCTION_NODE_TYPES.has(ancestor.type)) return ancestor.async !== true;
    }

    return false;
}

function walkSyntax(
    value: unknown,
    ancestors: SyntaxNode[],
    visit: (node: SyntaxNode, ancestors: SyntaxNode[]) => void,
) {
    if (!value || typeof value !== 'object') return;

    const node = value as Partial<SyntaxNode>;
    if (typeof node.type !== 'string' || typeof node.start !== 'number' || typeof node.end !== 'number') {
        return;
    }

    const syntaxNode = node as SyntaxNode;
    visit(syntaxNode, ancestors);
    const nextAncestors = [...ancestors, syntaxNode];

    Object.entries(syntaxNode).forEach(([key, child]) => {
        if (['loc', 'start', 'end'].includes(key)) return;
        if (Array.isArray(child)) {
            child.forEach(item => walkSyntax(item, nextAncestors, visit));
        } else {
            walkSyntax(child, nextAncestors, visit);
        }
    });
}

export function getMissingAwaitCalls(code: string): MissingAwaitCall[] {
    try {
        const ast = parse(code, {
            ecmaVersion: 'latest',
            sourceType: 'script',
            locations: true,
            allowAwaitOutsideFunction: true,
        }) as unknown as SyntaxNode;
        const calls: MissingAwaitCall[] = [];

        walkSyntax(ast, [], (node, ancestors) => {
            if (node.type !== 'CallExpression') return;

            const callee = node.callee;
            const name = callee?.type === 'Identifier' ? callee.name : undefined;
            if (!name || !ASYNC_HELPER_NAMES.has(name)) return;
            if (isHandledPromise(ancestors) || isInsideNonAsyncFunction(ancestors)) return;

            calls.push({
                name,
                start: node.start,
                lineNumber: node.loc?.start.line ?? 1,
            });
        });

        return calls;
    } catch {
        return [];
    }
}
