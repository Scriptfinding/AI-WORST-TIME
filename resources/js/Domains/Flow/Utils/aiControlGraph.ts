import { buildLibraryCompliantNodalGraph } from '@/Domains/Library/Utils/libraryCodeExport';
import {
    compileNodalGraphToCode,
    normalizeNodalGraph,
    SYSTEM_RUN_NODE_ID,
} from '@/Domains/Flow/Pages/FlowEditor/nodalCompiler';
import {
    CODE_NODE_NAME,
    DEFAULT_INPUT_PORT,
    DEFAULT_OUTPUT_PORT,
    SET_OUTPUT_NODE_NAME,
    STICKY_NOTE_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import type {
    NodalGraph,
    NodeParameterValue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { SYSTEM_RUN_POSITION } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/layout';
import type { ActionLogEntry } from '@/Domains/Flow/types';

export interface AiControlSequence {
    id: string;
    parent: ActionLogEntry;
    actions: ActionLogEntry[];
}

export interface GeneratedAiControlFlow {
    title: string;
    description: string;
    graph: NodalGraph;
    code: string;
}

const AI_PROVIDER_LABELS: Record<string, string> = {
    openai: 'OpenAI',
    gemini: 'Gemini',
    anthropic: 'Claude',
    mistral: 'Mistral',
};

const fixed = (value: unknown): NodeParameterValue => ({
    mode: 'fixed',
    value: value == null ? '' : typeof value === 'string' ? value : String(value),
});

const object = (value: Record<string, unknown>): NodeParameterValue => ({
    mode: 'object',
    inputMode: 'json',
    jsonMode: 'fixed',
    value: JSON.stringify(value, null, 2),
    fields: [],
});

const withoutUndefined = (value: Record<string, unknown>) => Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
);

const isFiniteNumber = (value: unknown): value is number => typeof value === 'number' && Number.isFinite(value);
const clampedNumber = (value: unknown, fallback: number, min: number, max: number) => (
    Math.min(Math.max(Number(value) || fallback, min), max)
);

const actionArgs = (action: ActionLogEntry): Record<string, unknown> => (
    action.args && typeof action.args === 'object' && !Array.isArray(action.args)
        ? action.args as Record<string, unknown>
        : {}
);

const scalarValues = (values: Record<string, unknown>) => Object.fromEntries(
    Object.entries(values)
        .filter(([, value]) => value !== undefined)
        .map(([key, value]) => [key, fixed(value)]),
);

const codeNode = (code: string) => ({
    name: CODE_NODE_NAME,
    values: { code: fixed(code) },
});

const disabledAnnotation = (action: ActionLogEntry, reason: string) => codeNode([
    `// AI Control ${action.facade ?? 'policy'}.${action.action}`,
    `// ${reason.replace(/\r?\n/g, ' ')}`,
].join('\n'));

const browserCode = (action: ActionLogEntry, args: Record<string, unknown>) => {
    const json = JSON.stringify;
    switch (action.action) {
        case 'goto':
            return `await $gotoUrl(${json(args.url)}, ${json(typeof args.tabName === 'string' && args.tabName ? args.tabName : 'Default')}, ${json(withoutUndefined({ waitUntil: args.waitUntil, timeout: args.timeout }))});`;
        case 'click':
            if (isFiniteNumber(args.x) && isFiniteNumber(args.y)) {
                return `await $page.mouse.click(${args.x}, ${args.y});`;
            }
            return [
                `const element = await $selectElement(${json(typeof args.selector === 'string' && args.selector ? args.selector : 'button, [role="button"], input[type="button"], input[type="submit"], a')}, ${json(withoutUndefined({ textMatch: args.text, textFilter: 'contains', timeout: clampedNumber(args.timeout, 10000, 500, 30000) }))});`,
                'if (!element) throw new Error(\'AI browser click target was not found.\');',
                `await element.click(${json({ button: ['left', 'middle', 'right'].includes(String(args.button)) ? args.button : 'left' })});`,
            ].join('\n');
        case 'type':
            return [
                `const element = await $page.waitForSelector(${json(typeof args.selector === 'string' && args.selector ? args.selector : 'input, textarea, [contenteditable="true"]')});`,
                args.clear === false ? null : 'await element.click({ clickCount: 3 });',
                args.clear === false ? null : "await $page.keyboard.press('Backspace');",
                `await element.type(${json(args.value)}, { delay: ${Number(args.delay) || 20} });`,
            ].filter(Boolean).join('\n');
        case 'press':
            return `await $page.keyboard.press(${json(args.key)});`;
        case 'hover':
            return `await $page.hover(${json(args.selector)});`;
        case 'select': {
            const values = Array.isArray(args.values) ? args.values : [args.value];
            return `await $page.select(${[args.selector, ...values].map(value => json(value)).join(', ')});`;
        }
        case 'scroll':
            if (typeof args.selector === 'string' && args.selector) {
                return `await $page.$eval(${json(args.selector)}, (element, pixels) => element.scrollBy(0, pixels), ${Number(args.pixels) || 0});`;
            }
            return `await $page.evaluate(pixels => window.scrollBy(0, pixels), ${Number(args.pixels) || 0});`;
        case 'waitForSelector':
            return `await $page.waitForSelector(${json(args.selector)}, ${json(withoutUndefined({ timeout: args.timeout, visible: args.visible, hidden: args.hidden }))});`;
        case 'wait':
            return `await $sleep(${Number(args.milliseconds) || 500});`;
        default:
            return `// Unsupported AI browser action: ${action.action}`;
    }
};

const mapActionToNode = (action: ActionLogEntry) => {
    const args = actionArgs(action);
    if (action.facade === 'policy') {
        return disabledAnnotation(action, action.error || 'AI policy rejected this action.');
    }
    if (['finish', 'return'].includes(action.action)) {
        return disabledAnnotation(action, `Terminal action payload: ${JSON.stringify(action.args)}`);
    }
    if (action.facade === 'browser') {
        if (action.action === 'click' && isFiniteNumber(args.x) && isFiniteNumber(args.y)) {
            return {
                name: '$clickAtCoordinates',
                values: {
                    ...scalarValues({
                        coordinateX: args.x,
                        coordinateY: args.y,
                    }),
                    options: object({
                        delay: clampedNumber(args.delay, 1000, 0, 5000),
                        buttonType: ['left', 'middle', 'right'].includes(String(args.button)) ? args.button : 'left',
                    }),
                },
            };
        }
        if (action.action === 'wait') {
            return {
                name: '$sleep',
                values: scalarValues({ milliseconds: Number(args.milliseconds) || 500 }),
            };
        }
        return codeNode(browserCode(action, args));
    }

    switch (action.action) {
        case 'goto':
            return {
                name: '$gotoUrl',
                values: {
                    url: fixed(args.url),
                    tabName: fixed(typeof args.tabName === 'string' && args.tabName ? args.tabName : 'Default'),
                    options: object({
                        waitUntil: typeof args.waitUntil === 'string' ? args.waitUntil : 'networkidle2',
                        timeout: clampedNumber(args.timeout, 30000, 500, 30000),
                        bypassCSP: false,
                    }),
                },
            };
        case 'click': {
            const selector = typeof args.selector === 'string' && args.selector
                ? args.selector
                : 'button, [role="button"], input[type="button"], input[type="submit"], a';
            const options = object({
                delay: clampedNumber(args.delay, 250, 0, 5000),
                buttonType: ['left', 'middle', 'right'].includes(String(args.button)) ? args.button : 'left',
                textMatch: typeof args.text === 'string' ? args.text : null,
                textFilter: 'contains',
                visibleOnly: true,
                timeout: clampedNumber(args.timeout, 10000, 500, 30000),
            });
            if (typeof args.index === 'number' && Number.isInteger(args.index)) {
                return {
                    name: '$clickElementAtIndex',
                    values: {
                        elementsSelector: fixed(selector),
                        elementIndex: fixed(Math.max(0, Number(args.index))),
                        options,
                    },
                };
            }
            return {
                name: '$clickElement',
                values: {
                    selectorOrHandle: fixed(selector),
                    options,
                },
            };
        }
        case 'fill':
            return {
                name: '$fillInput',
                values: {
                    inputSelectorOrHandle: fixed(args.selector),
                    inputValue: fixed(args.value),
                    options: object({
                        textMatch: typeof args.text === 'string' ? args.text : null,
                        textFilter: 'contains',
                        visibleOnly: true,
                        tabCount: clampedNumber(args.tabCount, 0, 0, 5),
                        sleep: clampedNumber(args.sleep, 100, 0, 5000),
                        speed: clampedNumber(args.speed, 20, 0, 1000),
                        timeout: clampedNumber(args.timeout, 10000, 500, 30000),
                    }),
                },
            };
        case 'scroll':
            return {
                name: '$scroll',
                values: scalarValues({
                    scrollPixels: Number(args.pixels) || 0,
                    selectorOrHandle: args.selector,
                }),
            };
        case 'wait':
            if (typeof args.selector === 'string' && args.selector) {
                return {
                    name: '$selectElement',
                    values: {
                        selectorOrHandle: fixed(args.selector),
                        options: object(withoutUndefined({
                            textMatch: typeof args.text === 'string' ? args.text : null,
                            textFilter: 'contains',
                            visibleOnly: args.visible !== false,
                            timeout: clampedNumber(args.timeout, 10000, 500, 30000),
                        })),
                    },
                };
            }
            return {
                name: '$sleep',
                values: scalarValues({ milliseconds: Number(args.milliseconds) || 500 }),
            };
        case 'shadowFill':
            return {
                name: '$shadowInputFill',
                values: {
                    inputSelector: fixed(args.selector),
                    inputValue: fixed(args.value),
                    options: object({
                        rootSelector: args.rootSelector,
                        tabCount: clampedNumber(args.tabCount, 0, 0, 5),
                        sleep: clampedNumber(args.sleep, 100, 0, 5000),
                        speed: clampedNumber(args.speed, 20, 0, 1000),
                    }),
                },
            };
        case 'shadowClick':
            return codeNode([
                `const element = await $selectShadow(${JSON.stringify(args.selector)}, ${JSON.stringify(args.rootSelector)});`,
                `await $clickElement(element, ${JSON.stringify({
                    visibleOnly: true,
                    timeout: clampedNumber(args.timeout, 10000, 500, 30000),
                    delay: clampedNumber(args.delay, 250, 0, 5000),
                })});`,
            ].join('\n'));
        case 'captureScreenshot':
            return {
                name: '$screenshot',
                values: {
                    screenshotName: fixed(args.name || 'ai-control-screenshot'),
                    options: object({ output: true }),
                },
            };
        case 'createArtifact':
            return {
                name: '$createArtifact',
                values: {
                    artifactName: fixed(args.name),
                    content: fixed(args.content),
                    options: object({
                        format: typeof args.format === 'string' ? args.format : 'text',
                        output: args.output !== false,
                        overwrite: args.overwrite !== false,
                        structuredSpacing: isFiniteNumber(args.structuredSpacing) ? args.structuredSpacing : 2,
                    }),
                },
            };
        case 'extract':
            return disabledAnnotation(action, 'Read-only page digest used by AI Control to gather links, headings and images.');
        case 'output':
            return {
                name: SET_OUTPUT_NODE_NAME,
                values: {
                    variables: object(args),
                },
            };
        default:
            return disabledAnnotation(action, 'This AI action has no visual node mapping.');
    }
};

const edge = (sourceNodeId: string, targetNodeId: string): NodalGraph['edges'][number] => ({
    id: `${sourceNodeId}:${DEFAULT_OUTPUT_PORT}->${targetNodeId}:${DEFAULT_INPUT_PORT}`,
    sourceNodeId,
    targetNodeId,
    sourcePort: DEFAULT_OUTPUT_PORT,
    targetPort: DEFAULT_INPUT_PORT,
});

export const buildAiControlFlow = (
    sequence: AiControlSequence,
    sourceFlowName: string,
): GeneratedAiControlFlow => {
    const sourceLabel = sequence.parent.label || 'AI Control';
    const title = `${sourceFlowName} - ${sourceLabel}`;
    const description = `Generated from AI Control sequence ${sequence.id}.`;
    const parentArgs = actionArgs(sequence.parent);
    const resolvedProvider = typeof parentArgs.provider === 'string' ? parentArgs.provider : '';
    const provider = resolvedProvider
        ? AI_PROVIDER_LABELS[resolvedProvider] ?? resolvedProvider
        : 'Unavailable';
    const resolvedModel = typeof parentArgs.model === 'string' && parentArgs.model
        ? parentArgs.model
        : '';
    const aiModelId = resolvedModel
        ? resolvedModel
        : 'Unavailable';
    const prompt = typeof parentArgs.prompt === 'string' && parentArgs.prompt
        ? parentArgs.prompt
        : 'Unavailable';
    const stickyNoteContent = [
        `### Generated by ${sourceLabel}`,
        '',
        `**Provider:** ${provider}`,
        `**Model:** ${aiModelId}`,
        '',
        '**Prompt:**',
        ...prompt.split(/\r?\n/).map(line => `> ${line}`),
    ].join('\n');
    const actionNodes: NodalGraph['nodes'] = sequence.actions.map((action, index) => {
        const mapped = mapActionToNode(action);
        return {
            id: `ai-action:${sequence.id}:${index + 1}`,
            name: mapped.name,
            label: `${action.action}${action.status === 'error' ? ' (failed)' : ''}`,
            x: 192 + index * 192,
            y: SYSTEM_RUN_POSITION.y,
            values: mapped.values,
            deactivated: action.status === 'error' || action.facade === 'policy' || ['finish', 'return'].includes(action.action),
        };
    });
    const executableNodeIds = actionNodes.filter(node => !node.deactivated).map(node => node.id);
    const sequenceNodeIds = [SYSTEM_RUN_NODE_ID, ...executableNodeIds];
    const graph = normalizeNodalGraph({
        nodes: [
            {
                id: `ai-group:${sequence.id}`,
                name: STICKY_NOTE_NODE_NAME,
                kind: 'stickyNote',
                label: `Generated by ${sourceLabel}`,
                x: 192,
                y: SYSTEM_RUN_POSITION.y - 240,
                stickyNote: {
                    content: stickyNoteContent,
                    color: 'purple',
                    width: 360,
                    height: 240,
                },
            },
            ...actionNodes,
        ],
        edges: sequenceNodeIds.slice(0, -1).map((sourceNodeId, index) => edge(sourceNodeId, sequenceNodeIds[index + 1])),
    });

    return {
        title,
        description,
        graph,
        code: compileNodalGraphToCode(graph),
    };
};

export const downloadAiControlFlow = (flow: GeneratedAiControlFlow) => {
    const blob = new Blob([
        buildLibraryCompliantNodalGraph({
            title: flow.title,
            description: flow.description,
            graph: flow.graph,
        }),
    ], { type: 'application/json;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${flow.title.trim().replace(/[^a-z0-9._-]+/gi, '-').replace(/^-+|-+$/g, '') || 'ai-control-flow'}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
};
