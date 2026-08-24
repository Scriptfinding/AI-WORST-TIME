import type { Flow, FlowRun, FlowTrigger, FlowAction } from '@/Domains/Flow/types';
import type { Breadcrumb, FolderTree, TeamTree } from '@/Domains/Folder/types';
import type { PaginatedData } from '@/Shared/Types/pagination';
import type { Integration } from '@/Domains/Integration/types';
import type { MailboxWatcher } from '@/Domains/Mailbox/types';
import type { Id } from '@/Shared/types';
import type { WorkspaceProxy } from '@/Domains/Workspace/types';

export type TabKey = 'code' | 'info' | 'settings' | 'automation' | 'mailboxes' | 'runs' | 'repository';

export const VALID_TABS: TabKey[] = ['code', 'info', 'settings', 'automation', 'mailboxes', 'runs', 'repository'];

export type LogLevel = 'all' | 'debug' | 'info' | 'warn' | 'error';

export interface SiteUrlContextDef {
    contextPath: string[];
    urlPaths: string[][];
}

export interface NodalSelectOption {
    value: string;
    label: string;
    detail?: string;
}

export interface NodalParamDef {
    label?: string;
    description: string;
    picker?: 'selector';
    placeholder?: string;
    defaultValue?: string;
    valueType?: 'string' | 'number' | 'boolean' | 'array' | 'object' | 'custom-object' | 'getter-map' | 'function-map' | 'function' | 'code' | 'flow' | 'channel' | 'mailbox-watcher' | 'ai-model' | 'ai-vision-model';
    required?: boolean;
    input?: 'text' | 'textarea' | 'code' | 'select' | 'object' | 'custom-object' | 'getter-map' | 'function-map' | 'boolean' | 'number' | 'channel' | 'mailbox-watcher' | 'ai-model' | 'ai-vision-model' | 'tab-name';
    options?: NodalSelectOption[];
    objectFields?: Record<string, NodalParamDef>;
    requiredOneOf?: string[][];
}

export interface NodalFlowPortDef {
    id: string;
    label: string;
    kind: 'continuation' | 'branch' | 'callback';
}

export type HelpEntryAvailability = 'nodal' | 'code' | 'both' | 'none';

export interface HelpEntryDef {
    name: string;
    signature: string;
    desc: string;
    displayLabel?: string;
    aliases?: string[];
    nodalDesc?: string;
    nodalOutput?: string;
    category: string;
    availability?: HelpEntryAvailability;
    options?: string;
    evalExpr?: string;
    paramHints?: Record<string, string>;
    nodalParams?: Record<string, NodalParamDef>;
    nodalFlowPorts?: NodalFlowPortDef[];
    siteUrlContexts?: SiteUrlContextDef[];
    localFunctionId?: string;
    editUrl?: string;
}

export interface FlowStats {
    total: number;
    success: number;
    failed: number;
    cancelled: number;
    total_duration_ms: number;
}

export interface FlowEditorProps {
    flow: Flow;
    stats: FlowStats;
    myManualInput: Record<string, unknown> | null;
    runs: PaginatedData<FlowRun>;
    breadcrumbs: Breadcrumb[];
    siblingFlows: Pick<Flow, 'id' | 'name' | 'icon_type' | 'icon_value' | 'icon_color' | 'icon_url' | 'library_reference'>[];
    canEdit: boolean;
    workspaceProxies: Pick<WorkspaceProxy, 'id' | 'label' | 'scheme' | 'host' | 'port'>[];
    myTriggers: FlowTrigger[];
    myActions: FlowAction[];
    otherTriggers: FlowTrigger[];
    otherActions: FlowAction[];
    teams: { id: Id; name: string }[];
    variableGroups: string[];
    vaultIntegrations: Integration[];
    aiIntegrations: Pick<Integration, 'id' | 'name' | 'provider'>[];
    messengerIntegrations: Pick<Integration, 'id' | 'name' | 'provider'>[];
    mailboxIntegrations: Integration[];
    mailboxDomains: { id: number; name: string }[];
    aiModelGroups: string[];
    channelGroups: string[];
    mailboxGroups: string[];
    personalTree: FolderTree[];
    repositoryIntegrations: Integration[];
    triggerGroups: string[];
    actionGroups: string[];
    mailboxWatchers: MailboxWatcher[];
    watcherGroups: string[];
    mailboxes: { id: Id; slug: string; domain: { id: number; name: string } }[];
    workspaceTree: FolderTree[];
    teamTrees?: TeamTree[];
}

export const DEFAULT_CODE = `// Puppeteer flow code
// Available helpers: $gotoUrl, $gotoTab, $fillInput, $screenshot, $clickElement, etc.

async function run($page, $input) {
    await $gotoUrl('https://example.com', 'Default');
    await $screenshot('initial');
    await $waitHumanValidation();
    $meta('timestamp', new Date().toISOString());
    $legend('Custom Run Title');
    $setOutput('my_declarative_custom_data', 'hello');

    // Your automation code here

    return $generateResponseSuccess('Flow completed', {
        my_returned_custom_data: 'hello',
    });
}

async function terminate($page, $input, $output) {
    // Always executed after run(), even on error
    // $output.status is 'success' or 'error'
    // $output is the full output object (includes $output() keys and $generateResponse data)
    // $page is the Puppeteer page, when still available
}
`;

export const STATUS_VARIANT: Record<string, 'warning' | 'info' | 'success' | 'error' | 'default'> = {
    pending: 'warning',
    running: 'info',
    success: 'success',
    error: 'error',
    cancelled: 'default',
};
