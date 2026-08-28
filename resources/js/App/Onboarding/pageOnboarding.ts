export type OnboardingLayout = 'hero' | 'split' | 'cards' | 'timeline' | 'poster';
export type OnboardingAccent = 'blue' | 'cyan' | 'amber' | 'pink' | 'lime' | 'violet';
export const ONBOARDING_RESET_EVENT = 'puppetflow:onboarding-reset';

interface PageOnboardingCopy {
    key: string;
    version: number;
    title: string;
    description: string;
    highlights: string[];
    nextStep: string;
    matches: (path: string) => boolean;
}

export interface PageOnboardingDefinition extends PageOnboardingCopy {
    marketingLine: string;
    icon: string;
    mediaIcons: [string, string];
    brandIcons?: string[];
    layout: OnboardingLayout;
    accent: OnboardingAccent;
}

const exact = (expected: string) => (path: string) => path === expected;

const PAGE_ONBOARDING: PageOnboardingCopy[] = [
    {
        key: 'dashboard',
        version: 1,
        title: 'Welcome to your dashboard',
        description: 'The dashboard gives you a quick view of your workspace and the fastest ways to start automating.',
        highlights: ['Review recent activity and runs', 'Create a flow or import a blueprint', 'Jump to the tools you use most'],
        nextStep: 'Start by creating a flow or opening an existing automation.',
        matches: exact('/'),
    },
    {
        key: 'runs',
        version: 1,
        title: 'Monitor your runs',
        description: 'The runs page centralizes the execution history of every flow in the current workspace.',
        highlights: ['Check status, duration, and start time', 'Filter runs to find a specific execution', 'Open details, artifacts, and recordings'],
        nextStep: 'Open a recent run to inspect its execution details.',
        matches: exact('/flows/runs'),
    },
    {
        key: 'flows',
        version: 1,
        title: 'Organize your flows',
        description: 'The flow explorer is the home of all browser automations in the current workspace.',
        highlights: ['Browse flows and folders', 'Search, sort, and change the explorer view', 'Create, import, move, or duplicate flows'],
        nextStep: 'Create a flow or open one to edit and run it.',
        matches: exact('/flows'),
    },
    {
        key: 'variables',
        version: 1,
        title: 'Reuse values with variables',
        description: 'Variables keep values available for reuse across flows without duplicating configuration.',
        highlights: ['Create shared or personal values', 'Group and search variables', 'Reference variables from flow inputs'],
        nextStep: 'Create a variable for a value you use in more than one flow.',
        matches: exact('/variables'),
    },
    {
        key: 'channels',
        version: 1,
        title: 'Configure notification channels',
        description: 'Channels define where Puppetflow sends notifications. They require a Messenger integration configured first.',
        highlights: ['Configure Slack, Discord, or Telegram in Integrations', 'Create a channel from the connected Messenger account', 'Reuse channels across flows'],
        nextStep: 'Open Integrations and configure a Messenger provider before creating your first channel.',
        matches: exact('/channels'),
    },
    {
        key: 'mailboxes',
        version: 1,
        title: 'Manage automation mailboxes',
        description: 'Mailboxes give flows an email address for receiving messages and attachments. They require a Mailbox integration configured first.',
        highlights: ['Configure a Mailbox provider in Integrations', 'Create an address from the connected provider', 'Use incoming messages to power automations'],
        nextStep: 'Open Integrations and configure a Mailbox provider before creating your first mailbox.',
        matches: exact('/mailboxes'),
    },
    {
        key: 'snippets',
        version: 1,
        title: 'Reuse automation snippets',
        description: 'Snippets store reusable pieces of logic that can be inserted into your flows.',
        highlights: ['Create and edit reusable code', 'Organize snippets by type and group', 'Import snippets from the blueprint library'],
        nextStep: 'Create a snippet for logic you expect to use in several flows.',
        matches: exact('/snippets'),
    },
    {
        key: 'data-tables',
        version: 1,
        title: 'Structure data for your automations',
        description: 'Data Tables give your workspace a direct place to store and edit structured records.',
        highlights: ['Control table visibility and ownership', 'Define typed columns for consistent values', 'Edit rows directly in a spreadsheet-style grid'],
        nextStep: 'Create a data table, then add your first columns and rows.',
        matches: exact('/data-tables'),
    },
    {
        key: 'integrations',
        version: 1,
        title: 'Connect external services',
        description: 'Integrations connect Puppetflow to the services and accounts used by your automations.',
        highlights: ['Discover available integration types', 'Configure service access securely', 'Manage connected accounts and domains'],
        nextStep: 'Add the service required by your next automation.',
        matches: exact('/integrations'),
    },
    {
        key: 'workspace.settings',
        version: 1,
        title: 'Configure your workspace',
        description: 'Workspace settings control the identity and default behavior of the current workspace.',
        highlights: ['Update workspace details and appearance', 'Configure available workspace options', 'Review settings that affect all members'],
        nextStep: 'Review the defaults before your team starts building flows.',
        matches: exact('/workspace/settings'),
    },
    {
        key: 'workspace.members',
        version: 1,
        title: 'Manage workspace access',
        description: 'The members page controls who can access this workspace and what they are allowed to do.',
        highlights: ['Invite and remove members', 'Assign roles and permissions', 'Organize members into teams when available'],
        nextStep: 'Invite a teammate or review the permissions of existing members.',
        matches: exact('/workspace/members'),
    },
    {
        key: 'profile',
        version: 1,
        title: 'Manage your profile',
        description: 'Your profile contains personal settings, security options, and API access.',
        highlights: ['Update your identity and timezone', 'Change password and security settings', 'Create API keys and open API documentation'],
        nextStep: 'Check your timezone first so run dates are displayed correctly.',
        matches: exact('/profile'),
    },
    {
        key: 'admin.users',
        version: 1,
        title: 'Administer users',
        description: 'This page lets instance administrators manage every Puppetflow user account.',
        highlights: ['Search and review user accounts', 'Update roles and account access', 'Perform account administration actions'],
        nextStep: 'Use search to locate the account you need to manage.',
        matches: exact('/admin/users'),
    },
    {
        key: 'admin.workspaces',
        version: 1,
        title: 'Administer workspaces',
        description: 'This page gives instance administrators a global view of all workspaces.',
        highlights: ['Review workspace ownership and usage', 'Open workspace administration actions', 'Locate workspaces across the instance'],
        nextStep: 'Select a workspace to review its administrative details.',
        matches: exact('/admin/workspaces'),
    },
    {
        key: 'admin.server',
        version: 1,
        title: 'Configure the server',
        description: 'Server settings control instance-wide behavior and features for every workspace.',
        highlights: ['Review global configuration', 'Manage instance-level feature settings', 'Check settings before enabling them for users'],
        nextStep: 'Review the current values before changing instance-wide behavior.',
        matches: exact('/admin/server'),
    },
];

type OnboardingPresentation = Pick<PageOnboardingDefinition, 'icon' | 'mediaIcons' | 'layout' | 'accent'>
    & Pick<PageOnboardingDefinition, 'brandIcons'>;

const MARKETING_LINES: Record<string, string> = {
    dashboard: 'Turn every idea into an automation from one clear starting point.',
    runs: 'Keep every automation accountable, observable, and under control.',
    flows: 'Bring every browser automation together in one organized workspace.',
    variables: 'Change a value once and keep every connected automation in sync.',
    channels: 'Deliver the right automation update to the right conversation instantly.',
    mailboxes: 'Turn every incoming email into a trigger your automations can act on.',
    snippets: 'Write useful logic once, then reuse it everywhere.',
    'data-tables': 'Give every automation a reliable place to read and write structured data.',
    integrations: 'Connect the services your automations need to do real work.',
    'workspace.settings': 'Shape a workspace that works exactly the way your team does.',
    'workspace.members': 'Bring the right people together with the right level of access.',
    profile: 'Make Puppetflow feel personal, secure, and ready for your workflow.',
    'admin.users': 'Manage access across your entire Puppetflow instance from one place.',
    'admin.workspaces': 'See and govern every automation workspace at a glance.',
    'admin.server': 'Set the foundations that keep your entire platform running smoothly.',
};

const PRESENTATIONS: Record<string, OnboardingPresentation> = {
    dashboard: {
        icon: 'lucide:sparkles',
        mediaIcons: ['lucide:activity', 'lucide:rocket'],
        layout: 'hero',
        accent: 'amber',
    },
    runs: {
        icon: 'lucide:gauge',
        mediaIcons: ['lucide:circle-check', 'lucide:timer'],
        layout: 'timeline',
        accent: 'cyan',
    },
    flows: {
        icon: 'lucide:workflow',
        mediaIcons: ['lucide:folder-tree', 'lucide:search'],
        layout: 'cards',
        accent: 'blue',
    },
    variables: {
        icon: 'lucide:braces',
        mediaIcons: ['lucide:key-round', 'lucide:repeat-2'],
        layout: 'split',
        accent: 'cyan',
    },
    channels: {
        icon: 'lucide:radio-tower',
        mediaIcons: ['lucide:send', 'lucide:bell-ring'],
        brandIcons: ['logos:slack-icon', 'logos:discord-icon', 'logos:telegram'],
        layout: 'hero',
        accent: 'pink',
    },
    mailboxes: {
        icon: 'lucide:mail-open',
        mediaIcons: ['lucide:paperclip', 'lucide:inbox'],
        layout: 'cards',
        accent: 'amber',
    },
    snippets: {
        icon: 'lucide:code-xml',
        mediaIcons: ['lucide:copy', 'lucide:library'],
        layout: 'poster',
        accent: 'violet',
    },
    'data-tables': {
        icon: 'lucide:database',
        mediaIcons: ['lucide:table', 'lucide:panel-top'],
        layout: 'cards',
        accent: 'lime',
    },
    integrations: {
        icon: 'lucide:plug-zap',
        mediaIcons: ['lucide:blocks', 'lucide:shield-check'],
        layout: 'timeline',
        accent: 'blue',
    },
    'workspace.settings': {
        icon: 'lucide:sliders-horizontal',
        mediaIcons: ['lucide:palette', 'lucide:settings-2'],
        layout: 'split',
        accent: 'amber',
    },
    'workspace.members': {
        icon: 'lucide:users-round',
        mediaIcons: ['lucide:user-plus', 'lucide:shield'],
        layout: 'cards',
        accent: 'cyan',
    },
    profile: {
        icon: 'lucide:badge-check',
        mediaIcons: ['lucide:user-round', 'lucide:key-round'],
        layout: 'poster',
        accent: 'pink',
    },
    'admin.users': {
        icon: 'lucide:contact-round',
        mediaIcons: ['lucide:search', 'lucide:user-cog'],
        layout: 'split',
        accent: 'violet',
    },
    'admin.workspaces': {
        icon: 'lucide:panels-top-left',
        mediaIcons: ['lucide:building-2', 'lucide:chart-no-axes-column'],
        layout: 'cards',
        accent: 'blue',
    },
    'admin.server': {
        icon: 'lucide:server-cog',
        mediaIcons: ['lucide:database', 'lucide:toggle-right'],
        layout: 'hero',
        accent: 'amber',
    },
};

export function findPageOnboarding(url: string): PageOnboardingDefinition | undefined {
    const path = new URL(url, window.location.origin).pathname.replace(/\/+$/, '') || '/';
    const copy = PAGE_ONBOARDING.find(item => item.matches(path));
    if (!copy) return undefined;

    return {
        ...copy,
        version: 3,
        marketingLine: MARKETING_LINES[copy.key],
        ...PRESENTATIONS[copy.key],
    };
}
