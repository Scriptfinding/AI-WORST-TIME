export interface ProviderMeta {
    icon: string;
    label: string;
    color: string;
}

export const PROVIDER_META: Record<string, ProviderMeta> = {
    telegram: { icon: 'mdi:telegram', label: 'Telegram', color: '#26A5E4' },
    discord: { icon: 'simple-icons:discord', label: 'Discord', color: '#5865F2' },
    slack: { icon: 'logos:slack-icon', label: 'Slack', color: '#E01E5A' },
};
