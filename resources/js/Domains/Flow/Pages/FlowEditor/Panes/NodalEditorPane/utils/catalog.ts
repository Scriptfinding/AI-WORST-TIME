import { ALL_HELP_ENTRIES } from '@/Domains/Flow/Pages/FlowEditor/utils/helpCatalog';
import type { HelpEntryDef, NodalParamDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import {
    CODE_NODE_ENTRY,
    CODE_NODE_NAME,
    CONTROL_NODE_ENTRIES,
    FALLBACK_CATEGORY,
    FUNCTION_DECLARATION_ENTRY,
    FUNCTION_DECLARATION_NODE_NAME,
    NODE_CATEGORIES,
    NODE_ICON_BY_CATEGORY,
    NODE_ICON_BY_NAME,
    SYSTEM_NODE_ENTRIES,
} from './constants';
import { isHelpCategoryPick } from '@/Domains/Flow/Pages/FlowEditor/categories';

const HIDDEN_VISUAL_NODE_NAMES = new Set(['$page', '$client']);

export const VISUAL_HELP_ENTRIES = [FUNCTION_DECLARATION_ENTRY, CODE_NODE_ENTRY, ...CONTROL_NODE_ENTRIES, ...ALL_HELP_ENTRIES]
    .filter(entry => (
        (entry.availability === 'nodal' || entry.availability === 'both')
        && !HIDDEN_VISUAL_NODE_NAMES.has(entry.name)
    ));

export const getNodeCategoryKey = (entry: HelpEntryDef) => {
    return NODE_CATEGORIES.find(category => !isHelpCategoryPick(category) && category.match(entry))?.key ?? FALLBACK_CATEGORY.key;
};

export const uniqueEntriesByName = (entries: HelpEntryDef[]) => {
    const seen = new Set<string>();

    return entries.filter(entry => {
        if (seen.has(entry.name)) return false;
        seen.add(entry.name);
        return true;
    });
};

export const getEntryByName = (name: string): HelpEntryDef => {
    if (name === CODE_NODE_NAME) return CODE_NODE_ENTRY;

    return uniqueEntriesByName(VISUAL_HELP_ENTRIES).find(entry => entry.name === name) ?? {
        name,
        signature: name,
        desc: 'Custom visual node.',
        category: 'Custom',
    };
};

export const getNodeCategoryColor = (entry: HelpEntryDef) => {
    if (entry.name === SYSTEM_NODE_ENTRIES.run.name) return '#22c55e';
    if (entry.name === SYSTEM_NODE_ENTRIES.function.name) return '#64748b';
    return NODE_CATEGORIES.find(category => category.key === getNodeCategoryKey(entry))?.color ?? FALLBACK_CATEGORY.color;
};

const ACTION_NODE_ENTRY_BY_ACTION: Record<string, string> = {
    aiControl: '$aiControl',
    aiMessage: '$aiMessage',
    httpRequest: '$httpRequest',
    breakpoint: '$waitHumanValidation',
    click: '$clickElement',
    cookies: '$saveCookies',
    createArtifact: '$createArtifact',
    download: '$download',
    evaluate: '$bridgeEvaluate',
    fill: '$fillInput',
    goto: '$gotoUrl',
    'goto-tab': '$gotoTab',
    legend: '$legend',
    log: '$log',
    login: '$loginRemember',
    meta: '$meta',
    notify: '$notify',
    pdfGetText: '$pdfSearch',
    pdfSearch: '$pdfSearch',
    press: '$fillInput',
    scroll: '$scroll',
    screenshot: '$screenshot',
    set: '$setOutput',
    sleep: '$sleep',
    timeout: '$generateResponseError',
    upload: '$upload',
    waitEmail: '$waitForEmail',
    waitFile: '$waitForFile',
    waitHuman: '$waitHumanValidation',
    waitSelector: '$waitForSelectorCondition',
};

export const getEntryByAction = (action: string): HelpEntryDef => {
    return getEntryByName(ACTION_NODE_ENTRY_BY_ACTION[action] ?? action);
};

export const getSignatureArgs = (signature: string) => {
    const match = signature.match(/\((.*)\)/);
    if (!match?.[1]?.trim()) return [];

    return match[1]
        .split(',')
        .map(arg => arg.trim())
        .filter(Boolean);
};

export const getParameterHint = (entry: HelpEntryDef, arg: string) => {
    const cleanArg = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
    const explicitHint = getParameterMeta(entry, cleanArg).description ?? entry.paramHints?.[cleanArg];
    if (explicitHint) return explicitHint;

    return null;
};

export const getParameterMeta = (entry: HelpEntryDef, arg: string): NodalParamDef => {
    const cleanArg = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
    const explicitMeta = entry.nodalParams?.[cleanArg];
    const optionFields = cleanArg === 'options' ? parseOptionFieldMetadata(entry.options) : {};
    if (explicitMeta) {
        return {
            ...explicitMeta,
            ...(isObjectLikeParam(cleanArg) ? { input: 'object' as const } : {}),
            objectFields: mergeObjectFieldMetadata(optionFields, explicitMeta.objectFields),
        };
    }

    const label = formatParameterLabel(cleanArg);
    return {
        label,
        description: cleanArg === 'options'
            ? 'Configure advanced options for this node. Use JSON for full control, or Form to fill individual settings.'
            : `Set the ${label.toLowerCase()} value for this node.`,
        input: isObjectLikeParam(cleanArg) ? 'object' : 'text',
        ...(Object.keys(optionFields).length > 0 ? { objectFields: optionFields } : {}),
    };
};

function mergeObjectFieldMetadata(
    baseFields: Record<string, NodalParamDef>,
    overrideFields?: Record<string, NodalParamDef>,
): Record<string, NodalParamDef> {
    const keys = new Set([...Object.keys(baseFields), ...Object.keys(overrideFields ?? {})]);

    return Object.fromEntries(
        [...keys].map(key => [key, {
            ...(baseFields[key] ?? {}),
            ...(overrideFields?.[key] ?? {}),
        }]),
    );
}

export const isObjectLikeParam = (arg: string) => {
    const cleanArg = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
    return ['options', 'data', 'additionalData'].includes(cleanArg);
};

export const formatParameterLabel = (arg: string) => {
    return arg
        .replace(/\?$/, '')
        .replace(/^\.\.\./, '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/^./, letter => letter.toUpperCase());
};

const OPTION_DESCRIPTIONS: Record<string, string> = {
    timeout: 'Maximum time to wait before this step fails, in milliseconds.',
    delay: 'Time to wait before performing the action, in milliseconds.',
    sleep: 'Pause duration between low-level browser actions, in milliseconds.',
    speed: 'Typing speed for human-like input, in milliseconds between keystrokes.',
    continueOnError: 'When enabled, the flow continues even if this step cannot complete.',
    textMatch: 'Text to match against the element visible text.',
    textFilter: 'Text filter mode: contains, exact, startsWith, or endsWith.',
    textCaseSensitive: 'Preserve letter casing when matching text.',
    visibleOnly: 'Only use elements that are visible on the page.',
    index: 'Zero-based position to use when several elements match. Use -1 only when the helper supports all matches.',
    tabCount: 'Number of Tab key presses to send after filling the input.',
    rootSelector: 'CSS selector for the shadow DOM root to search inside.',
    output: 'Include this generated file or artifact in the flow output.',
    store: 'Keep extracted files after the run instead of cleaning them up automatically.',
    keepArchive: 'Keep the archive file after extraction.',
    waitUntil: 'Browser navigation event to wait for before continuing.',
    headers: 'Extra HTTP headers to send during navigation.',
    bypassCSP: 'Bypass the page Content Security Policy to allow helper injection.',
    loginUrl: 'URL of the login page.',
    loginRecipe: 'Automation steps used to log in when cookies are not valid.',
    loggedUrl: 'URL that should be reachable after login.',
    loggedMarkerCondition: 'Condition used to detect that the user is logged in.',
    loggedMarkerConditionRaw: 'Raw JavaScript condition used to detect that the user is logged in.',
    loggedMarkerTimeout: 'Maximum time to wait for the logged-in marker.',
    password: 'Password value to use for the login recipe.',
};

const OPTION_SELECT_CHOICES: Record<string, { value: string; label: string }[]> = {
    format: [
        { value: 'text', label: 'Text' },
        { value: 'json', label: 'JSON' },
        { value: 'yaml', label: 'YAML' },
        { value: 'csv', label: 'CSV' },
        { value: 'toml', label: 'TOML' },
        { value: 'xml', label: 'XML' },
    ],
    textFilter: [
        { value: 'contains', label: 'Contains' },
        { value: 'exact', label: 'Exact match' },
        { value: 'startsWith', label: 'Starts with' },
        { value: 'endsWith', label: 'Ends with' },
    ],
    method: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'].map(value => ({ value, label: value })),
    bodyType: [
        { value: 'json', label: 'JSON' },
        { value: 'raw', label: 'Raw' },
        { value: 'form', label: 'Form URL Encoded' },
        { value: 'multipart', label: 'Multipart Form Data' },
    ],
    responseFormat: [
        { value: 'auto', label: 'Autodetect' },
        { value: 'json', label: 'JSON' },
        { value: 'text', label: 'Text' },
        // { value: 'file', label: 'File' },
    ],
    waitUntil: [
        { value: 'networkidle0', label: 'networkidle0' },
        { value: 'domcontentloaded', label: 'domcontentloaded' },
        { value: 'networkidle2', label: 'networkidle2' },
        { value: 'load', label: 'load' },
        { value: 'commit', label: 'commit' },
    ],
};

const OPTION_NUMBER_FIELDS = new Set([
    'timeout',
    'delay',
    'sleep',
    'speed',
    'index',
    'tabCount',
    'loggedMarkerTimeout',
]);

function parseOptionFieldMetadata(options?: string): Record<string, NodalParamDef> {
    if (!options) return {};

    const entries: [string, NodalParamDef][] = options
        .split(',')
        .map(option => option.trim())
        .filter(Boolean)
        .flatMap(option => {
            const [rawKey, ...rawDefaultParts] = option.split(':');
            const key = rawKey?.trim();
            if (!key) return [];
            const defaultValue = normalizeOptionDefaultValue(rawDefaultParts.join(':'));
            const valueType = defaultValue === 'true' || defaultValue === 'false'
                ? 'boolean' as const
                : OPTION_NUMBER_FIELDS.has(key) || /^-?\d+(\.\d+)?$/.test(defaultValue ?? '')
                    ? 'number' as const
                    : undefined;
            const input = valueType === 'boolean' || valueType === 'number' ? valueType : undefined;

            return [[key, {
                label: formatParameterLabel(key),
                description: OPTION_DESCRIPTIONS[key] ?? `Set ${formatParameterLabel(key).toLowerCase()} for this options object.`,
                ...(defaultValue ? { defaultValue } : {}),
                ...(valueType ? { valueType } : {}),
                ...(input ? { input } : {}),
                ...(OPTION_SELECT_CHOICES[key] ? { input: 'select' as const, options: OPTION_SELECT_CHOICES[key] } : {}),
            }]];
        });

    return Object.fromEntries(entries);
}

function normalizeOptionDefaultValue(value: string): string | undefined {
    const cleaned = value
        .trim()
        .split(/\s+-\s+/, 1)[0]
        .trim();
    const firstUnionValue = cleaned.split('|')[0]?.trim() ?? cleaned;
    const numericFallback = firstUnionValue.match(/^\([^)]*(-?\d+(?:\.\d+)?)[^)]*\)$/)?.[1];
    const defaultValue = numericFallback ?? firstUnionValue;
    const unquotedDefaultValue = defaultValue.replace(/^(['"])(.*)\1$/, '$2');
    if (unquotedDefaultValue.toLowerCase() === 'flow timeout') return '30000';

    return unquotedDefaultValue.toLowerCase() === 'null' ? undefined : unquotedDefaultValue;
}

const NODE_LABEL_BY_NAME: Record<string, string> = {
    Set: 'Set variable',
    $setOutput: 'Set Output',
    $aiMessage: 'AI Message',
    $aiControl: 'AI Control',
    $httpRequest: 'HTTP Request',
    $dataTableInsertRow: 'Insert Row',
    $dataTableUpdateRows: 'Update Row(s)',
    $dataTableUpsertRows: 'Upsert Row(s)',
    $dataTableRowExists: 'If Row Exists',
    $dataTableRowDoesNotExist: 'If Row Does Not Exist',
    $dataTableGetRows: 'Get Row(s)',
    $dataTableDeleteRows: 'Delete Row(s)',
    $dataTableCreate: 'Create Data Table',
    $dataTableDelete: 'Delete Data Table',
    $dataTableList: 'List Data Tables',
    $dataTableUpdate: 'Update Data Table',
};

export const formatNodeLabel = (name: string) => {
    if (NODE_LABEL_BY_NAME[name]) return NODE_LABEL_BY_NAME[name];

    const cleanName = name
        .replace(/^\$\$?/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

export const formatLocalFunctionCallLabel = (name: string) => `Call ${name}`;

// Preferred label for an entry: explicit display label (snippets) before the derived name.
export const formatEntryLabel = (entry: HelpEntryDef) => entry.displayLabel?.trim() || formatNodeLabel(entry.name);

export const formatToolboxNodeLabel = (entry: HelpEntryDef) => {
    if (entry.name === FUNCTION_DECLARATION_NODE_NAME) return 'Declare Function';
    if (entry.localFunctionId) return formatLocalFunctionCallLabel(entry.name);

    return formatEntryLabel(entry);
};

export const getNodeIcon = (entry: HelpEntryDef) => {
    if (entry.localFunctionId) return 'lucide:corner-down-right';
    return NODE_ICON_BY_NAME[entry.name] ?? NODE_ICON_BY_CATEGORY[entry.category] ?? 'lucide:box';
};

export const sortEntries = (entries: HelpEntryDef[], priority: string[] = []) => {
    return [...entries].sort((a, b) => {
        const aPriority = priority.indexOf(a.name);
        const bPriority = priority.indexOf(b.name);

        if (aPriority !== -1 || bPriority !== -1) {
            if (aPriority === -1) return 1;
            if (bPriority === -1) return -1;
            return aPriority - bPriority;
        }

        return a.name.localeCompare(b.name);
    });
};
