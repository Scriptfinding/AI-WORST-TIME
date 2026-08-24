import { getPrimaryHelpCategory, HELP_CATEGORY_PAGES } from '@/Domains/Flow/Pages/FlowEditor/categories';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import { HELP_ENTRIES } from './helpCatalog';

export const sortHelpEntries = (entries: HelpEntryDef[], priority: string[] = []) => {
    return [...entries].sort((a, b) => {
        const aPriority = priority.indexOf(a.name);
        const bPriority = priority.indexOf(b.name);

        if (aPriority !== -1 || bPriority !== -1) {
            if (aPriority === -1) return 1;
            if (bPriority === -1) return -1;
            return aPriority - bPriority;
        }

        return formatHelpEntryLabel(a).localeCompare(formatHelpEntryLabel(b));
    });
};

const normalizeHelpSearch = (value: string) => value.replace(/^\$\$?/, '').toLowerCase();

const getHelpSearchRank = (entry: HelpEntryDef, query: string) => {
    const name = normalizeHelpSearch(entry.name);
    const label = entry.displayLabel ? normalizeHelpSearch(entry.displayLabel) : null;
    const signature = normalizeHelpSearch(entry.signature);
    const category = entry.category.toLowerCase();
    const desc = entry.desc.toLowerCase();
    const aliases = entry.aliases?.map(normalizeHelpSearch) ?? [];

    if (name === query || label === query) return 0;
    if (name.startsWith(query) || label?.startsWith(query)) return 1;
    if (name.includes(query) || label?.includes(query)) return 2;
    if (aliases.some(alias => alias === query)) return 3;
    if (aliases.some(alias => alias.startsWith(query))) return 4;
    if (aliases.some(alias => alias.includes(query))) return 5;
    if (signature.includes(query)) return 6;
    if (category.includes(query)) return 7;
    if (desc.includes(query)) return 8;

    return null;
};

export const searchHelpEntries = (entries: HelpEntryDef[], search: string) => {
    const query = normalizeHelpSearch(search.trim());
    if (!query) return sortHelpEntries(entries);

    return entries
        .map(entry => ({ entry, rank: getHelpSearchRank(entry, query) }))
        .filter((result): result is { entry: HelpEntryDef; rank: number } => result.rank !== null)
        .sort((a, b) => a.rank - b.rank || a.entry.name.localeCompare(b.entry.name))
        .map(result => result.entry);
};

export const getHelpCategoryKey = (entry: HelpEntryDef) => {
    return getPrimaryHelpCategory(entry)?.key ?? null;
};

export const uniqueHelpEntriesByName = (entries: HelpEntryDef[]) => {
    const seen = new Set<string>();

    return entries.filter(entry => {
        if (seen.has(entry.name)) return false;
        seen.add(entry.name);
        return true;
    });
};

export const getHelpCategoryColor = (entry: HelpEntryDef) => {
    return HELP_CATEGORY_PAGES.find(category => category.key === getHelpCategoryKey(entry))?.color ?? '#64748b';
};

export const NATIVE_HELPER_REFERENCES = new Set(HELP_ENTRIES.map(entry => entry.name.replace(/^\$/, '')));

const HELPER_ICON_BY_NAME: Record<string, string> = {
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
    $selectElement: 'lucide:scan-line',
    $selectManyElements: 'lucide:list-tree',
    $selectShadow: 'lucide:layers',
    $shadowInputFill: 'lucide:panel-top',
    $injectScriptLibrary: 'lucide:file-code-2',
    $bridgeEvaluate: 'lucide:code-2',
    $setOutput: 'lucide:package-plus',
    $if: 'lucide:git-branch',
    $ifEmpty: 'lucide:replace',
    $max: 'lucide:arrow-up-1-0',
    $min: 'lucide:arrow-down-1-0',
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
    $now: 'lucide:calendar-clock',
    $today: 'lucide:calendar-days',
    $parseDates: 'lucide:calendar-search',
    $sortDates: 'lucide:arrow-up-down',
    $saveCookies: 'lucide:cookie',
    $loadCookies: 'lucide:cookie',
    $loginRemember: 'lucide:shield-check',
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
    $input: 'lucide:braces',
    $page: 'lucide:panel-top',
    $client: 'lucide:plug',
};

const HELPER_ICON_BY_CATEGORY: Record<string, string> = {
    Navigation: 'lucide:compass',
    Interaction: 'lucide:mouse-pointer-click',
    Selectors: 'lucide:scan-line',
    'Extract Data': 'lucide:scan-search',
    'Page Eval': 'lucide:code-2',
    Files: 'lucide:folder-down',
    Date: 'lucide:calendar',
    Utility: 'lucide:wrench',
    Response: 'lucide:message-square-reply',
    Notification: 'lucide:bell',
    Mailbox: 'lucide:mail-search',
    Cookies: 'lucide:cookie',
    Globals: 'lucide:globe-2',
    AI: 'lucide:sparkles',
    Snippets: 'lucide:package',
};

export const formatHelpLabel = (name: string) => {
    if (name === '$setOutput') return 'Set Output';
    if (name === '$aiMessage') return 'AI Message';
    if (name === '$aiControl') return 'AI Control';
    if (name === '$httpRequest') return 'HTTP Request';

    const cleanName = name
        .replace(/^\$\$?/, '')
        .replace(/[_-]+/g, ' ')
        .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
        .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
        .replace(/\s+/g, ' ')
        .trim();

    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
};

export const formatHelpEntryLabel = (entry: HelpEntryDef) => {
    return entry.displayLabel || formatHelpLabel(entry.name);
};

export const getHelpIcon = (entry: HelpEntryDef) => {
    return HELPER_ICON_BY_NAME[entry.name] ?? HELPER_ICON_BY_CATEGORY[entry.category] ?? 'lucide:box';
};

export const buildHelpInsertText = (entry: HelpEntryDef) => {
    return entry.signature || entry.name;
};
