import { BRANDING_CHANGE_EVENT } from '@/App/Hooks/useThemeMode';
import { formatDocumentTitle } from '@/App/Utils/documentTitle';

type AppPageProps = Record<string, unknown>;

interface AppPage {
    component: string;
    props: AppPageProps;
}

interface AppPageBranding {
    name: string;
    accentColor: string;
    logoUrl: string;
}

const PAGE_TITLES: Record<string, string> = {
    'Admin/Server/Server': 'Server',
    'Admin/Users/Users': 'Users',
    'Admin/Workspaces/Workspaces': 'Workspaces',
    'AiModels/AiModels': 'AI Models',
    'Auth/Login/Login': 'Welcome back',
    'Auth/Register/Register': 'Create account',
    'Auth/TwoFactorChallenge/TwoFactorChallenge': 'Two-Factor Challenge',
    'Auth/TwoFactorSetup/TwoFactorSetup': 'Set Up Two-Factor Authentication',
    'Channels/Channels': 'Notification Channels',
    'Dashboard/Dashboard': 'Dashboard',
    'DataTable/DataTables': 'Data Tables',
    'Flow/FlowCreate/FlowCreate': 'Create Flow',
    'Flow/FlowExplorer/FlowExplorer': 'Flow Explorer',
    'Flow/Runs/Runs': 'Runs',
    'Integrations/Integrations': 'Integrations',
    'License/Launcher': 'Activate Puppetflow',
    'Mailbox/Mailboxes': 'Mailboxes',
    'Profile/Profile': 'Profile',
    'Snippet/Snippets': 'Snippets',
    'Variables/Variables': 'Variables',
    'Workspace/WorkspaceCreate/WorkspaceCreate': 'Create Workspace',
    'Workspace/WorkspaceMembers/WorkspaceMembers': 'Workspace Members',
    'Workspace/WorkspaceSettings/WorkspaceSettings': 'Workspace Settings',
};

function getNamedProp(props: AppPageProps, key: string) {
    const value = props[key];

    if (value && typeof value === 'object' && 'name' in value && typeof value.name === 'string') {
        return value.name;
    }

    return null;
}

function getPageTitle(component: string, props: AppPageProps) {
    if (component === 'Flow/FlowEditor/FlowEditor') {
        return getNamedProp(props, 'flow');
    }

    if (component === 'Flow/RecordingPlayer/RecordingPlayerPage') {
        const flowName = getNamedProp(props, 'flow');
        return flowName ? `Recording - ${flowName}` : 'Recording';
    }

    return PAGE_TITLES[component] ?? null;
}

export function getAppPageBranding(props: AppPageProps): AppPageBranding | null {
    const branding = props.branding;
    if (!branding || typeof branding !== 'object') return null;

    const name = 'name' in branding && typeof branding.name === 'string' ? branding.name : 'Puppetflow';
    const accentColor = 'accent_color' in branding && typeof branding.accent_color === 'string'
        ? branding.accent_color
        : '#48C591';
    const logoUrl = 'logo_url' in branding && typeof branding.logo_url === 'string'
        ? branding.logo_url
        : '/img/logo/logo.png';

    return { name, accentColor, logoUrl };
}

function syncTimezone(props: AppPageProps) {
    if (typeof document === 'undefined') return;

    const auth = props.auth;
    const user = auth && typeof auth === 'object' && 'user' in auth ? auth.user : null;
    const timezone = user && typeof user === 'object' && 'timezone' in user && typeof user.timezone === 'string'
        ? user.timezone
        : null;

    if (timezone) {
        document.documentElement.dataset.timezone = timezone;
    }
}

function syncDocumentTitle(page: AppPage) {
    if (typeof document === 'undefined') return;

    document.title = formatDocumentTitle(getPageTitle(page.component, page.props), getAppPageBranding(page.props)?.name);
}

function syncBranding(props: AppPageProps) {
    if (typeof document === 'undefined' || typeof window === 'undefined') return;

    const branding = getAppPageBranding(props);
    if (!branding) return;

    const favicon = document.querySelector<HTMLLinkElement>('#app-favicon');
    if (favicon) favicon.href = branding.logoUrl;

    window.dispatchEvent(new CustomEvent(BRANDING_CHANGE_EVENT, { detail: branding.accentColor }));
}

export function syncAppPage(page: AppPage) {
    syncTimezone(page.props);
    syncDocumentTitle(page);
    syncBranding(page.props);
}
