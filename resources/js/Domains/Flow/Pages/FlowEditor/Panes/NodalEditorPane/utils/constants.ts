import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { NodeCategory, NodePortSide } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import { FALLBACK_HELP_CATEGORY, VISUAL_NODE_CATEGORY_PAGES } from '@/Domains/Flow/Pages/FlowEditor/categories';
import { getNodeFlowPortDefinitions } from './flowParameters';

export const CODE_NODE_NAME = 'Code';
export const STICKY_NOTE_NODE_NAME = '__sticky_note';
export const CODE_NODE_VALUE_KEY = 'code';
export const NODE_RUN_OUTPUT_KEY = '__runOutputKey';
export const IF_ELSE_NODE_NAME = 'If / Else';
export const DATA_TABLE_ROW_EXISTS_NODE_NAME = '$dataTableRowExists';
export const DATA_TABLE_ROW_DOES_NOT_EXIST_NODE_NAME = '$dataTableRowDoesNotExist';
export const isConditionalBranchNodeName = (name: string): boolean => (
    name === IF_ELSE_NODE_NAME
    || name === DATA_TABLE_ROW_EXISTS_NODE_NAME
    || name === DATA_TABLE_ROW_DOES_NOT_EXIST_NODE_NAME
);
export const LOOP_NODE_NAME = 'Loop';
export const MERGE_NODE_NAME = 'Merge';
export const NO_OP_NODE_NAME = 'No-op';
export const FILTER_NODE_NAME = 'Filter';
export const LIMIT_NODE_NAME = 'Limit';
export const SET_NODE_NAME = 'Set';
export const SET_OUTPUT_NODE_NAME = '$setOutput';
export const META_NODE_NAME = '$meta';
export const FUNCTION_DECLARATION_NODE_NAME = 'Function';
export const DEFAULT_INPUT_PORT = 'input';
export const DEFAULT_OUTPUT_PORT = 'output';

const LOOP_PARAMETER_KEYS_BY_MODE = {
    items: ['mode', 'items'],
    iterations: ['mode', 'iterations'],
    condition: ['mode', 'condition', 'maxIterations'],
} as const;

export const getLoopParameterKeysForMode = (mode: string): readonly string[] => {
    return LOOP_PARAMETER_KEYS_BY_MODE[mode as keyof typeof LOOP_PARAMETER_KEYS_BY_MODE] ?? LOOP_PARAMETER_KEYS_BY_MODE.items;
};

export const NODE_CARD_WIDTH = 72;
export const NODE_TILE_SIZE = 72;
export const NODE_LABEL_MIN_HEIGHT = 32;
export const NODE_TILE_LABEL_GAP = 8;
export const NODE_PORT_Y_OFFSET = -(NODE_LABEL_MIN_HEIGHT + NODE_TILE_LABEL_GAP) / 2;

export const CODE_NODE_ENTRY: HelpEntryDef = {
    name: CODE_NODE_NAME,
    signature: 'Code(code)',
    desc: 'Run a custom JavaScript step exactly at this position in the visual flow.',
    category: 'Advanced',
    availability: 'nodal',
};

export const STICKY_NOTE_ENTRY: HelpEntryDef = {
    name: STICKY_NOTE_NODE_NAME,
    signature: 'Sticky Note',
    desc: 'Markdown note for documenting the visual canvas.',
    category: 'Canvas',
    availability: 'nodal',
};

export const FUNCTION_DECLARATION_ENTRY: HelpEntryDef = {
    name: FUNCTION_DECLARATION_NODE_NAME,
    signature: `${FUNCTION_DECLARATION_NODE_NAME}(name, arguments)`,
    desc: 'Declare a private function available inside this visual graph.',
    category: 'Functions',
    availability: 'nodal',
    nodalParams: {
        name: {
            label: 'Function name',
            description: 'Unique JavaScript identifier used to call this private function.',
            placeholder: 'myFunction',
            required: true,
        },
        arguments: {
            label: 'Arguments',
            description: 'Define argument names as object keys. They are available through $input inside the function.',
            placeholder: '{\n  "customer": null,\n  "options": null\n}',
            input: 'custom-object',
            valueType: 'custom-object',
            required: false,
        },
    },
};

export const CONTROL_NODE_ENTRIES: HelpEntryDef[] = [
    {
        name: IF_ELSE_NODE_NAME,
        signature: `${IF_ELSE_NODE_NAME}(condition)`,
        desc: 'Branch the visual flow depending on a boolean expression.',
        category: 'Control',
        availability: 'nodal',
        nodalFlowPorts: [
            { id: 'true', label: 'True', kind: 'branch' },
            { id: 'false', label: 'False', kind: 'branch' },
        ],
        nodalParams: {
            condition: {
                label: 'Condition',
                description: 'Expression that must return true or false. Use {{ ... }} to read input or previous node results.',
                placeholder: '{{ $input.status === "active" }}',
            },
        },
    },
    {
        name: LOOP_NODE_NAME,
        signature: `${LOOP_NODE_NAME}(mode, items, iterations, condition, maxIterations)`,
        desc: 'Repeat a branch over items, a fixed iteration count, or until a condition stops it.',
        category: 'Control',
        availability: 'nodal',
        nodalFlowPorts: [
            { id: 'loop', label: 'Loop', kind: 'branch' },
            { id: 'done', label: 'Done', kind: 'continuation' },
        ],
        nodalParams: {
            mode: {
                label: 'Loop mode',
                description: 'Choose how the loop runs: over an items array, a fixed number of iterations, or while a condition is true.',
            },
            items: {
                label: 'Items',
                description: 'Array to iterate when mode is Items. Inside the loop branch, use $run.$loop.item for the current item and $run.$loop.index for its position.',
                placeholder: '{{ $input.items || [] }}',
                valueType: 'array',
            },
            iterations: {
                label: 'Iterations',
                description: 'Number of times to repeat when mode is Iterations. Inside the loop branch, use $run.$loop.index for the current position.',
                placeholder: '3',
                valueType: 'number',
            },
            condition: {
                label: 'Loop condition',
                description: 'Stop condition checked before each loop when mode is Condition. Return true to stop looping. Inside the loop branch, use $run.$loop.index for the current position.',
                placeholder: '{{ $nodes.last?.hasNext === true }}',
                valueType: 'boolean',
            },
            maxIterations: {
                label: 'Max iterations',
                description: 'Safety limit for condition loops, used to prevent infinite loops.',
                placeholder: '100',
                valueType: 'number',
            },
        },
    },
    {
        name: NO_OP_NODE_NAME,
        signature: `${NO_OP_NODE_NAME}()`,
        desc: 'Pass through without doing anything. Useful to organize and route the visual flow.',
        category: 'Control',
        availability: 'nodal',
    },
    {
        name: FILTER_NODE_NAME,
        signature: `${FILTER_NODE_NAME}(array, predicate)`,
        desc: 'Filter an array using a predicate expression evaluated for each item.',
        category: 'Data',
        availability: 'nodal',
        nodalParams: {
            array: {
                label: 'Array',
                description: 'Array to filter. Example: {{ $input.items || [] }} or {{ $nodes.last }}.',
                placeholder: '{{ $input.items || [] }}',
                valueType: 'array',
            },
            predicate: {
                label: 'Keep item when',
                description: 'Expression evaluated for each item. Use $item for the current item and $index for its position. Return true to keep the item.',
                placeholder: '{{ $item.status === "active" }}',
                valueType: 'boolean',
            },
        },
    },
    {
        name: LIMIT_NODE_NAME,
        signature: `${LIMIT_NODE_NAME}(array, count, offset)`,
        desc: 'Limit an array to a count and optional offset.',
        category: 'Data',
        availability: 'nodal',
        nodalParams: {
            array: {
                label: 'Array',
                description: 'Array to slice. Example: {{ $input.items || [] }} or {{ $nodes.last }}.',
                placeholder: '{{ $input.items || [] }}',
                valueType: 'array',
            },
            count: {
                label: 'Count',
                description: 'Maximum number of items to keep.',
                placeholder: '10',
                valueType: 'number',
            },
            offset: {
                label: 'Offset',
                description: 'Number of items to skip before keeping results.',
                placeholder: '0',
                valueType: 'number',
            },
        },
    },
    {
        name: SET_NODE_NAME,
        signature: `${SET_NODE_NAME}(variables)`,
        desc: 'Store reusable run variables for the following visual nodes.',
        category: 'Data',
        availability: 'nodal',
        nodalParams: {
            variables: {
                label: 'Variables',
                description: 'Run variables to create for following nodes under $run. Use Form for named variables, or JSON for an object.',
                placeholder: '{\n  "customerName": "{{ $nodes.last }}"\n}',
                input: 'custom-object',
                valueType: 'custom-object',
            },
        },
    },
    {
        name: SET_OUTPUT_NODE_NAME,
        signature: `${SET_OUTPUT_NODE_NAME}(variables)`,
        desc: 'Store variables in the final run output.',
        category: 'Response',
        availability: 'nodal',
        nodalParams: {
            variables: {
                label: 'Output variables',
                description: 'Output variables to add to the final response. Use Form for named variables, or JSON for an object.',
                placeholder: '{\n  "customerName": "{{ $nodes.last }}"\n}',
                input: 'custom-object',
                valueType: 'custom-object',
            },
        },
    },
];

export const SYSTEM_NODE_ENTRIES: Record<'run' | 'terminate' | 'function', HelpEntryDef> = {
    run: {
        name: 'RUN',
        signature: 'async function run($page, $input)',
        desc: 'Entry point of the generated flow code.',
        category: 'System',
    },
    terminate: {
        name: 'TERMINATE',
        signature: 'async function terminate($page, $input, $output)',
        desc: 'Always executed after run, even when the run fails.',
        category: 'System',
    },
    function: {
        name: 'FUNCTION',
        signature: 'FUNCTION(name, arguments)',
        desc: 'Entry point of a visual function.',
        category: 'System',
        nodalParams: FUNCTION_DECLARATION_ENTRY.nodalParams,
    },
};

const CONTROL_NODE_CATEGORY: NodeCategory = {
    key: 'control',
    label: 'Control Flow',
    description: 'Branch, loop, and shape run paths.',
    icon: 'lucide:git-branch',
    color: '#22c55e',
    priority: [IF_ELSE_NODE_NAME, LOOP_NODE_NAME, NO_OP_NODE_NAME],
    match: entry => entry.category === 'Control',
};

const DATA_NODE_CATEGORY: NodeCategory = {
    key: 'data',
    label: 'Data Transformation',
    description: 'Filter, limit, and transform runtime data.',
    icon: 'lucide:filter',
    color: '#b45309',
    priority: [SET_NODE_NAME, FILTER_NODE_NAME, LIMIT_NODE_NAME],
    match: entry => entry.category === 'Data',
};

const FUNCTION_NODE_CATEGORY: NodeCategory = {
    key: 'functions',
    label: 'Local Functions',
    description: 'Declare and call private visual functions.',
    icon: 'lucide:square-function',
    color: '#06b6d4',
    priority: [FUNCTION_DECLARATION_NODE_NAME],
    match: entry => entry.category === 'Functions',
};

const VISUAL_NODE_CATEGORIES: NodeCategory[] = VISUAL_NODE_CATEGORY_PAGES;

export const NODE_CATEGORIES: NodeCategory[] = [
    ...VISUAL_NODE_CATEGORIES.filter(category => category.key === 'start'),
    CONTROL_NODE_CATEGORY,
    ...VISUAL_NODE_CATEGORIES
        .filter(category => !['start', 'snippets'].includes(category.key))
        .flatMap(category => {
            if (category.key === 'output') return [DATA_NODE_CATEGORY, category];
            return [category];
        }),
    FUNCTION_NODE_CATEGORY,
    ...VISUAL_NODE_CATEGORIES.filter(category => category.key === 'snippets'),
];

export const FALLBACK_CATEGORY: NodeCategory = FALLBACK_HELP_CATEGORY;

export const NODE_ICON_BY_NAME: Record<string, string> = {
    Code: 'lucide:code-2',
    [IF_ELSE_NODE_NAME]: 'lucide:git-branch',
    [LOOP_NODE_NAME]: 'lucide:repeat',
    [MERGE_NODE_NAME]: 'lucide:merge',
    [NO_OP_NODE_NAME]: 'lucide:chevrons-right',
    [FILTER_NODE_NAME]: 'lucide:filter',
    [LIMIT_NODE_NAME]: 'lucide:list-filter',
    [SET_NODE_NAME]: 'lucide:package-plus',
    [FUNCTION_DECLARATION_NODE_NAME]: 'lucide:square-function',
    RUN: 'lucide:flag',
    TERMINATE: 'lucide:octagon',
    FUNCTION: 'lucide:box',
    $gotoUrl: 'lucide:compass',
    $gotoTab: 'lucide:panels-top-left',
    $screenshot: 'lucide:camera',
    $aiMessage: 'lucide:message-square-text',
    $aiControl: 'lucide:brain-circuit',
    $httpRequest: 'lucide:send',
    $waitHumanValidation: 'lucide:hand',
    $generateResponseSuccess: 'lucide:circle-check',
    $generateResponseError: 'lucide:circle-x',
    $generateResponse: 'lucide:message-square-reply',
    $stopFail: 'lucide:octagon-alert',
    $stopSuccess: 'lucide:badge-check',
    $fillInput: 'lucide:keyboard',
    $clickElement: 'lucide:mouse-pointer-click',
    $clickElementAtIndex: 'lucide:list-ordered',
    $clickAtCoordinates: 'lucide:locate-fixed',
    $scroll: 'lucide:scroll-text',
    $mapElement: 'lucide:scan-text',
    $mapManyElements: 'lucide:list-checks',
    $selectElement: 'lucide:scan-line',
    $selectManyElements: 'lucide:list-tree',
    $selectShadow: 'lucide:layers',
    $shadowInputFill: 'lucide:panel-top',
    $injectScriptLibrary: 'lucide:file-code-2',
    $bridgeEvaluate: 'lucide:code-2',
    $setOutput: 'lucide:package-plus',
    $vars: 'lucide:key-round',
    $meta: 'lucide:tags',
    $legend: 'lucide:text-cursor-input',
    $log: 'lucide:terminal',
    $sleep: 'lucide:timer',
    $keyboardSpeed: 'lucide:gauge',
    $setViewport: 'lucide:monitor',
    $currentDate: 'lucide:calendar',
    $currentDateMinusOneMonth: 'lucide:calendar-minus',
    $currentDatePlusOneMonth: 'lucide:calendar-plus',
    $parseDates: 'lucide:calendar-search',
    $sortDates: 'lucide:arrow-up-down',
    $saveCookies: 'lucide:cookie',
    $loadCookies: 'lucide:cookie',
    $loginRemember: 'lucide:shield-check',
    $createArtifact: 'lucide:file-plus-2',
    $scanDirectory: 'lucide:folder-search',
    $download: 'lucide:download',
    $downloadFromBrowser: 'lucide:cloud-download',
    $waitForFile: 'lucide:file-clock',
    $moveDownloadedFile: 'lucide:file-input',
    $getDownloadsPathFile: 'lucide:file-search',
    $upload: 'lucide:upload',
    $unzipFile: 'lucide:archive',
    $pdfSearch: 'lucide:file-search',
    $notify: 'lucide:bell',
    $waitForEmail: 'lucide:mail-search',
    $dataTableInsertRow: 'lucide:list-plus',
    $dataTableUpdateRows: 'lucide:list-restart',
    $dataTableUpsertRows: 'lucide:list-plus',
    $dataTableRowExists: 'lucide:list-check',
    $dataTableRowDoesNotExist: 'lucide:list-x',
    $dataTableGetRows: 'lucide:search',
    $dataTableDeleteRows: 'lucide:trash-2',
    $dataTableCreate: 'lucide:table-properties',
    $dataTableDelete: 'lucide:trash-2',
    $dataTableList: 'lucide:library',
    $dataTableUpdate: 'lucide:table-properties',
    $input: 'lucide:braces',
    $page: 'lucide:panel-top',
    $client: 'lucide:plug',
};

export const NODE_ICON_BY_CATEGORY: Record<string, string> = {
    Code: 'lucide:code-2',
    Navigation: 'lucide:compass',
    Interaction: 'lucide:mouse-pointer-click',
    Selectors: 'lucide:scan-line',
    'Page Eval': 'lucide:binary',
    Advanced: 'lucide:binary',
    Files: 'lucide:folder-down',
    Date: 'lucide:calendar',
    Utility: 'lucide:wrench',
    Functions: 'lucide:square-function',
    Response: 'lucide:message-square-reply',
    Notification: 'lucide:bell',
    Mailbox: 'lucide:mail-search',
    'Data Tables': 'lucide:table-properties',
    Cookies: 'lucide:cookie',
    Globals: 'lucide:globe-2',
    Control: 'lucide:git-branch',
    Data: 'lucide:filter',
};

export interface NodePortDefinition {
    id: string;
    label: string;
    side: NodePortSide;
}

export const getNodeInputPorts = (nodeName: string): NodePortDefinition[] => {
    if (nodeName === STICKY_NOTE_NODE_NAME || nodeName === SYSTEM_NODE_ENTRIES.run.name || nodeName === SYSTEM_NODE_ENTRIES.terminate.name || nodeName === SYSTEM_NODE_ENTRIES.function.name) return [];
    return [{ id: DEFAULT_INPUT_PORT, label: 'Input', side: 'input' }];
};

export const getNodeOutputPorts = (nodeName: string, entry?: HelpEntryDef): NodePortDefinition[] => {
    if (nodeName === STICKY_NOTE_NODE_NAME) return [];

    return getNodeFlowPortDefinitions(entry).map(definition => ({
        id: definition.id,
        label: definition.label,
        side: 'output' as const,
    }));
};
