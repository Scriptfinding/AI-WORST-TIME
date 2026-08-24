import type { OnMount } from '@monaco-editor/react';
import { parse } from 'acorn';
import { matchesCompletionModelUri } from './completionCore';

export const DEFAULT_TAB_NAME = 'Default';

const startsRegexLiteral = (source: string, index: number) => {
    const prefix = source.slice(0, index).trimEnd();
    const previous = prefix.at(-1);
    return !previous
        || '=(:,!&|?{};['.includes(previous)
        || /(?:=>|(?:return|case|throw|yield|await)\s*)$/.test(prefix);
};

const findTabHelperCalls = (source: string) => {
    const calls: {
        helper: 'gotoUrl' | 'gotoTab';
        argsStart: number;
    }[] = [];
    let quote: string | null = null;
    let escaped = false;
    let lineComment = false;
    let blockComment = false;
    let regexLiteral = false;
    let regexCharacterClass = false;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];
        if (lineComment) {
            if (char === '\n') lineComment = false;
            continue;
        }
        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                index += 1;
            }
            continue;
        }
        if (regexLiteral) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '[') {
                regexCharacterClass = true;
            } else if (char === ']') {
                regexCharacterClass = false;
            } else if (char === '/' && !regexCharacterClass) {
                regexLiteral = false;
            }
            continue;
        }
        if (quote) {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }
        if (char === '/' && next === '/') {
            lineComment = true;
            index += 1;
            continue;
        }
        if (char === '/' && next === '*') {
            blockComment = true;
            index += 1;
            continue;
        }
        if (char === '/' && startsRegexLiteral(source, index)) {
            regexLiteral = true;
            regexCharacterClass = false;
            escaped = false;
            continue;
        }
        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            continue;
        }
        if (char !== '$') continue;
        const previous = source[index - 1];
        if (previous && /[A-Za-z0-9_$?.]/.test(previous)) continue;

        const match = source.slice(index).match(/^\$(gotoUrl|gotoTab)\s*\(/);
        if (!match) continue;
        calls.push({
            helper: match[1] as 'gotoUrl' | 'gotoTab',
            argsStart: index + match[0].length,
        });
        index += match[0].length - 1;
    }

    return calls;
};

const splitCallArguments = (source: string) => {
    const args: string[] = [];
    let current = '';
    let quote: string | null = null;
    let escaped = false;
    let depth = 0;
    let lineComment = false;
    let blockComment = false;

    for (let index = 0; index < source.length; index += 1) {
        const char = source[index];
        const next = source[index + 1];
        if (lineComment) {
            if (char === '\n') {
                lineComment = false;
                current += ' ';
            }
            continue;
        }
        if (blockComment) {
            if (char === '*' && next === '/') {
                blockComment = false;
                index += 1;
                current += ' ';
            }
            continue;
        }
        if (quote) {
            current += char;
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === quote) {
                quote = null;
            }
            continue;
        }
        if (char === '/' && next === '/') {
            lineComment = true;
            index += 1;
            continue;
        }
        if (char === '/' && next === '*') {
            blockComment = true;
            index += 1;
            continue;
        }

        if (char === '"' || char === "'" || char === '`') {
            quote = char;
            current += char;
        } else if (char === '(' || char === '[' || char === '{') {
            depth += 1;
            current += char;
        } else if (char === ')' || char === ']' || char === '}') {
            if (depth === 0 && char === ')') break;
            depth = Math.max(0, depth - 1);
            current += char;
        } else if (char === ',' && depth === 0) {
            args.push(current.trim());
            current = '';
        } else {
            current += char;
        }
    }
    args.push(current.trim());

    return { args, openQuote: quote };
};

const decodeStringLiteral = (value: string) => {
    const quote = value[0];
    if (!quote || !['"', "'", '`'].includes(quote) || value.at(-1) !== quote) return null;
    const body = value.slice(1, -1);
    if (quote === '`' && body.includes('${')) return null;
    const decoded = body.replace(
        /\\(?:u\{([0-9a-fA-F]+)\}|u([0-9a-fA-F]{4})|x([0-9a-fA-F]{2})|\r?\n|.)/g,
        (escape, codePoint, unicode, hexadecimal) => {
            if (codePoint) {
                const parsed = Number.parseInt(codePoint, 16);
                return parsed <= 0x10FFFF ? String.fromCodePoint(parsed) : escape;
            }
            if (unicode) return String.fromCharCode(Number.parseInt(unicode, 16));
            if (hexadecimal) return String.fromCharCode(Number.parseInt(hexadecimal, 16));
            if (escape === '\\\n' || escape === '\\\r\n') return '';
            const character = escape.at(-1) ?? '';
            return ({
                b: '\b',
                f: '\f',
                n: '\n',
                r: '\r',
                t: '\t',
                v: '\v',
                0: '\0',
            } as Record<string, string>)[character] ?? character;
        },
    );
    return decoded.trim() || null;
};

const collectParsedGotoUrlTabNames = (source: string): string[] | null => {
    let ast: Record<string, unknown>;
    const options = {
        ecmaVersion: 'latest' as const,
        sourceType: 'module' as const,
        allowAwaitOutsideFunction: true,
        allowReturnOutsideFunction: true,
    };
    try {
        ast = parse(source, options) as unknown as Record<string, unknown>;
    } catch {
        try {
            ast = parse(`async function __puppetflowCodeNode() {\nfor (;;) {\n${source}\n}\n}`, options) as unknown as Record<string, unknown>;
        } catch {
            return null;
        }
    }

    const patternDeclaresGotoUrl = (value: unknown): boolean => {
        if (!value || typeof value !== 'object') return false;
        const pattern = value as Record<string, unknown>;
        if (pattern.type === 'Identifier') return pattern.name === '$gotoUrl';
        if (pattern.type === 'RestElement') return patternDeclaresGotoUrl(pattern.argument);
        if (pattern.type === 'AssignmentPattern') return patternDeclaresGotoUrl(pattern.left);
        if (pattern.type === 'ArrayPattern') {
            return (pattern.elements as unknown[] | undefined)?.some(patternDeclaresGotoUrl) ?? false;
        }
        if (pattern.type === 'ObjectPattern') {
            return (pattern.properties as Array<Record<string, unknown>> | undefined)?.some(property => (
                patternDeclaresGotoUrl(property.value ?? property.argument)
            )) ?? false;
        }
        return false;
    };
    let helperIsShadowed = false;
    const findShadowedHelper = (value: unknown) => {
        if (helperIsShadowed) return;
        if (Array.isArray(value)) {
            value.forEach(findShadowedHelper);
            return;
        }
        if (!value || typeof value !== 'object') return;

        const node = value as Record<string, unknown>;
        if (
            (node.type === 'VariableDeclarator' && patternDeclaresGotoUrl(node.id))
            || (
                ['FunctionDeclaration', 'FunctionExpression', 'ArrowFunctionExpression'].includes(String(node.type))
                && (
                    patternDeclaresGotoUrl(node.id)
                    || (node.params as unknown[] | undefined)?.some(patternDeclaresGotoUrl)
                )
            )
            || (
                String(node.type).startsWith('Import')
                && patternDeclaresGotoUrl(node.local)
            )
            || (node.type === 'CatchClause' && patternDeclaresGotoUrl(node.param))
        ) {
            helperIsShadowed = true;
            return;
        }
        Object.values(node).forEach(findShadowedHelper);
    };
    findShadowedHelper(ast);
    if (helperIsShadowed) return [];

    const names = new Set<string>();
    const visit = (value: unknown) => {
        if (Array.isArray(value)) {
            value.forEach(visit);
            return;
        }
        if (!value || typeof value !== 'object') return;

        const node = value as Record<string, unknown>;
        const callee = node.callee as Record<string, unknown> | undefined;
        if (
            node.type === 'CallExpression'
            && callee?.type === 'Identifier'
            && callee.name === '$gotoUrl'
        ) {
            const argument = (node.arguments as unknown[] | undefined)?.[1] as Record<string, unknown> | undefined;
            if (argument?.type === 'Literal' && typeof argument.value === 'string') {
                const name = argument.value.trim();
                if (name) names.add(name);
            } else if (argument?.type === 'TemplateLiteral') {
                const expressions = argument.expressions as unknown[] | undefined;
                const quasi = (argument.quasis as Array<Record<string, unknown>> | undefined)?.[0];
                const cooked = (quasi?.value as Record<string, unknown> | undefined)?.cooked;
                if (expressions?.length === 0 && typeof cooked === 'string' && cooked.trim()) {
                    names.add(cooked.trim());
                }
            }
        }

        Object.values(node).forEach(visit);
    };
    visit(ast);
    return [...names];
};

export function collectNamedTabsFromCode(source: string): string[] {
    const names = new Set([DEFAULT_TAB_NAME]);
    const parsedNames = collectParsedGotoUrlTabNames(source);
    if (parsedNames) {
        parsedNames.forEach(tabName => names.add(tabName));
        return [...names];
    }

    for (const call of findTabHelperCalls(source).filter(candidate => candidate.helper === 'gotoUrl')) {
        const { args } = splitCallArguments(source.slice(call.argsStart));
        const tabName = decodeStringLiteral(args[1] ?? '');
        if (tabName) names.add(tabName);
    }

    return [...names];
}

const getCompletionContext = (source: string) => {
    const call = findTabHelperCalls(source).at(-1);
    if (!call) return null;

    const helper = call.helper;
    const argsSource = source.slice(call.argsStart);
    const { args, openQuote } = splitCallArguments(argsSource);
    const targetIndex = helper === 'gotoUrl' ? 1 : 0;
    if (args.length - 1 !== targetIndex || !openQuote) return null;

    const activeArg = args[targetIndex] ?? '';
    const quoteIndex = activeArg.search(/["'`]/);
    if (quoteIndex < 0) return null;

    return {
        typed: activeArg.slice(quoteIndex + 1),
        helper,
    };
};

export function registerTabNameCompletions(
    monaco: Parameters<OnMount>[1],
    modelUri?: string | null,
    knownNames: string[] = [],
) {
    if (!monaco) return { dispose: () => {} };

    return monaco.languages.registerCompletionItemProvider('javascript', {
        triggerCharacters: ['"', "'", '`'],
        provideCompletionItems: (model, position) => {
            if (!matchesCompletionModelUri(model, modelUri)) return { suggestions: [] };

            const source = model.getValueInRange({
                startLineNumber: 1,
                startColumn: 1,
                endLineNumber: position.lineNumber,
                endColumn: position.column,
            });
            const context = getCompletionContext(source);
            if (!context) return { suggestions: [] };

            const names = [...new Set([
                DEFAULT_TAB_NAME,
                ...knownNames,
                ...collectNamedTabsFromCode(model.getValue()),
            ])];
            const range = {
                startLineNumber: position.lineNumber,
                endLineNumber: position.lineNumber,
                startColumn: position.column - context.typed.length,
                endColumn: position.column,
            };

            return {
                suggestions: names.map(name => ({
                    label: name,
                    kind: monaco.languages.CompletionItemKind.Value,
                    insertText: name,
                    detail: context.helper === 'gotoUrl' ? 'Named browser tab' : 'Existing browser tab',
                    documentation: `Browser tab: ${name}`,
                    range,
                    sortText: name === DEFAULT_TAB_NAME ? `0-${name}` : `1-${name}`,
                })),
            };
        },
    });
}
