import type { HelpEntryDef } from './types';

export interface HelpCategoryPage {
    key: string;
    label: string;
    description: string;
    icon: string;
    color: string;
    match: (entry: HelpEntryDef) => boolean;
    priority?: string[];
    pick?: boolean;
}

export const FILE_HELPER_NAMES = [
    '$createArtifact',
    '$scanDirectory',
    '$scanDownloadsDirectory',
    '$download',
    '$downloadFromBrowser',
    '$waitForFile',
    '$moveDownloadedFile',
    '$getDownloadsPathFile',
    '$unzipFile',
    '$pdfSearch',
    '$pdfGetText',
];

const EXTRACT_DATA_HELPER_NAMES = ['$mapElement', '$mapManyElements', '$selectElement', '$selectManyElements', '$selectShadow', '$selectAtIndex'];
const ADVANCED_EVAL_HELPER_NAMES = ['$bridgeEvaluate', '$injectScriptLibrary'];
const BROWSER_HELPER_NAMES = ['$gotoUrl', '$gotoTab', '$screenshot', '$page', '$client', '$setViewport'];
export const HIDDEN_TOOLBOX_ENTRY_NAMES = new Set(['$input', '$vars']);

export const HELP_CATEGORY_PAGES: HelpCategoryPage[] = [
    {
        key: 'start',
        label: 'Start Here',
        description: 'Useful first picks for common automation flows.',
        icon: 'lucide:rocket',
        color: '#64748b',
        priority: ['$gotoUrl', '$gotoTab', '$clickElement', '$fillInput', 'Set', 'If / Else', '$screenshot', '$waitHumanValidation', '$stopSuccess'],
        pick: true,
        match: entry => ['$gotoUrl', '$gotoTab', '$clickElement', '$fillInput', 'Set', 'If / Else', '$screenshot', '$waitHumanValidation', '$stopSuccess'].includes(entry.name),
    },
    {
        key: 'browser',
        label: 'Browser',
        description: 'Navigate pages, capture state, and access browser-level objects.',
        icon: 'lucide:panel-top',
        color: '#0ea5e9',
        priority: ['$gotoUrl', '$gotoTab', '$loginRemember', '$screenshot', '$setViewport', '$page', '$client'],
        match: entry => BROWSER_HELPER_NAMES.includes(entry.name) || entry.category === 'Navigation',
    },
    {
        key: 'ai',
        label: 'AI',
        description: 'Ask language models and automate browser decisions with vision.',
        icon: 'lucide:sparkles',
        color: '#8b5cf6',
        priority: ['$aiMessage', '$aiControl'],
        match: entry => entry.category === 'AI',
    },
    {
        key: 'interact',
        label: 'Click & Type',
        description: 'Fill forms, click buttons, scroll pages, and upload files.',
        icon: 'lucide:mouse-pointer-click',
        color: '#f97316',
        priority: ['$fillInput', '$shadowInputFill', '$clickElement', '$clickElementAtIndex', '$clickAtCoordinates', '$scroll', '$upload', '$keyboardSpeed'],
        match: entry => (['Interaction', 'Selectors'].includes(entry.category) && !EXTRACT_DATA_HELPER_NAMES.includes(entry.name)) || entry.name === '$upload',
    },
    {
        key: 'human',
        label: 'Messenger & Inbox',
        description: 'Wait for people, send notifications, or react to mailbox events.',
        icon: 'lucide:messages-square',
        color: '#ec4899',
        priority: ['$notify', '$waitHumanValidation', '$waitForEmail'],
        match: entry => ['Notification', 'Mailbox'].includes(entry.category),
    },
    {
        key: 'extract',
        label: 'Selectors',
        description: 'Select elements, parse content, and transform values.',
        icon: 'lucide:scan-search',
        color: '#8b5cf6',
        priority: ['$selectElement', '$selectAtIndex', '$selectManyElements', '$selectShadow', '$mapElement', '$mapManyElements'],
        match: entry => entry.category === 'Extract Data' || EXTRACT_DATA_HELPER_NAMES.includes(entry.name),
    },
    {
        key: 'files',
        label: 'Files & Downloads',
        description: 'Create, download, move, unzip, search, and upload files.',
        icon: 'lucide:folder-down',
        color: '#06b6d4',
        priority: ['$download', '$downloadFromBrowser', '$waitForFile', '$moveDownloadedFile', '$getDownloadsPathFile', '$scanDirectory', '$scanDownloadsDirectory', '$unzipFile', '$createArtifact', '$pdfSearch', '$pdfGetText'],
        match: entry => entry.category === 'Files' || FILE_HELPER_NAMES.includes(entry.name),
    },
    {
        key: 'output',
        label: 'Output & Response',
        description: 'Build the run response, attach custom data, and add run metadata.',
        icon: 'lucide:message-square-reply',
        color: '#ef4444',
        priority: ['$setOutput', '$generateResponseSuccess', '$generateResponseError', '$generateResponse', '$stopSuccess', '$stopFail', '$meta', '$legend', '$log'],
        match: entry => entry.category === 'Response' || ['$setOutput', '$meta', '$legend', '$log'].includes(entry.name),
    },
    {
        key: 'dates',
        label: 'Dates & Time',
        description: 'Parse, sort, and compute dates used in automations.',
        icon: 'lucide:calendar',
        color: '#eab308',
        priority: ['$currentDate', '$currentDateMinusOneMonth', '$currentDatePlusOneMonth', '$parseDates', '$sortDates'],
        match: entry => entry.category === 'Date',
    },
    {
        key: 'data-tables',
        label: 'Data Tables',
        description: 'Read, write, query, and manage custom data tables.',
        icon: 'lucide:table-properties',
        color: '#0f766e',
        priority: [
            '$dataTableInsertRow',
            '$dataTableUpdateRows',
            '$dataTableUpsertRows',
            '$dataTableGetRows',
            '$dataTableRowExists',
            '$dataTableRowDoesNotExist',
            '$dataTableDeleteRows',
            '$dataTableCreate',
            '$dataTableUpdate',
            '$dataTableList',
            '$dataTableDelete',
        ],
        match: entry => entry.category === 'Data Tables',
    },
    {
        key: 'utility',
        label: 'Utilities',
        description: 'Timing, selector helpers, and small automation helpers.',
        icon: 'lucide:wrench',
        color: '#64748b',
        priority: ['$sleep', '$waitForSelectorCondition', '$if', '$ifEmpty', '$min', '$max', '$matchSequence'],
        match: entry => entry.category === 'Utility' && !['$vars', '$setOutput', '$meta', '$legend', '$log', '$setViewport'].includes(entry.name),
    },
    {
        key: 'advanced',
        label: 'Advanced',
        description: 'Use browser internals, cookies, raw Puppeteer objects, globals, and custom code.',
        icon: 'lucide:binary',
        color: '#6366f1',
        priority: ['Code', '$httpRequest', '$bridgeEvaluate', '$injectScriptLibrary', '$saveCookies', '$loadCookies'],
        match: entry => entry.category === 'Advanced' || entry.category === 'Cookies' || ADVANCED_EVAL_HELPER_NAMES.includes(entry.name),
    },
    {
        key: 'snippets',
        label: 'Snippets',
        description: 'Reusable workspace snippets callable from flow code.',
        icon: 'lucide:package',
        color: '#14b8a6',
        match: entry => entry.category === 'Snippets' && entry.name.startsWith('$$'),
    },
];

export const VISUAL_NODE_CATEGORY_PAGES = HELP_CATEGORY_PAGES;
export const PICK_HELP_CATEGORY_KEYS = new Set(HELP_CATEGORY_PAGES.filter(category => category.pick).map(category => category.key));
export const isHelpCategoryPick = (category: { key: string }) => PICK_HELP_CATEGORY_KEYS.has(category.key);
export const getPrimaryHelpCategory = (entry: HelpEntryDef) => HELP_CATEGORY_PAGES.find(category => !category.pick && category.match(entry)) ?? null;

export const FALLBACK_HELP_CATEGORY: HelpCategoryPage = {
    key: 'all',
    label: 'All Nodes',
    description: 'Every available function from the help catalog.',
    icon: 'lucide:boxes',
    color: '#64748b',
    match: () => true,
};
