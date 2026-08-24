import type { FeatureFlagValue, ServerTab } from './types';

const FLAG_ACRONYMS: Record<string, string> = { mcp: 'MCP' };
const FLAG_LABELS: Record<string, string> = {
    mailbox_enabled: 'Mailboxes',
    ai_enabled: 'AI Support',
    messenger_enabled: 'Notification channels',
    mcp_enabled: 'MCP Server',
    run_metadata_search_enabled: 'Search Runs by Metadata',
    vcs_enabled: 'Version Control with Git',
    two_factor_enforcement_enabled: '2FA enforcement',
    sso_enabled: 'SSO SAML & LDAP',
};

export async function responseError(response: Response): Promise<string> {
    const payload = await response.json().catch(() => ({})) as {
        message?: string;
        errors?: Record<string, string[]>;
    };
    const firstError = Object.values(payload.errors ?? {})[0]?.[0];

    return firstError ?? payload.message ?? 'Something went wrong. Please try again.';
}

export function retrySeconds(message: string): number {
    const match = message.match(/wait\s+(\d+)\s+seconds?/i);
    return match ? Number(match[1]) : 0;
}

export function getInitialTab(search: string, brandingEnabled: boolean, ssoEnabled: boolean): ServerTab {
    const tab = new URLSearchParams(search).get('tab');
    if (tab === 'license') return tab;
    if (tab === 'branding' && brandingEnabled) return 'branding';
    if (tab === 'sso' && ssoEnabled) return 'sso';
    return 'general';
}

export function formatFlagName(key: string): string {
    if (key in FLAG_LABELS) return FLAG_LABELS[key];

    const words = key
        .replace(/_enabled$/, '')
        .split('_')
        .map(word => FLAG_ACRONYMS[word] ?? word);

    const label = words.join(' ');
    return label.charAt(0).toUpperCase() + label.slice(1);
}

export function formatFlagValue(value: FeatureFlagValue): string {
    if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
    if (typeof value === 'number' && value === -1) return 'Unlimited';
    return String(value);
}

export function formatBytes(bytes: number | null | undefined): string {
    if (bytes == null) return '-';
    if (bytes === 0) return '0 B';

    if (bytes >= 900_000_000_000) {
        const value = bytes / 1_000_000_000_000;
        return `${value.toFixed(value >= 10 ? 0 : 1)} TB`;
    }

    const units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB'];
    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1000)), units.length - 1);
    const value = bytes / Math.pow(1000, index);

    return `${value >= 10 || index === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[index]}`;
}

export function progressBarWidth(percentage: number | null): number {
    if (percentage == null) return 0;
    return percentage > 0 ? Math.max(percentage, 2) : 0;
}
