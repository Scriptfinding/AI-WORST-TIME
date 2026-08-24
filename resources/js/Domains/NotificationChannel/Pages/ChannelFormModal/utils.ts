import type { Integration } from '@/Domains/Integration/types';

export type MessengerIntegration = Pick<Integration, 'id' | 'name' | 'provider'>;

export interface ChatOption {
    id: string;
    name: string;
}

export interface DetectResult {
    ok: boolean;
    chat_id?: string;
    chat_name?: string;
    error?: string;
}

export function getAvailableMessengers(integrations: MessengerIntegration[]): string[] {
    return Object.keys(
        integrations.reduce<Record<string, true>>((providers, integration) => {
            providers[integration.provider as string] = true;
            return providers;
        }, {}),
    );
}

export function getIntegrationsForMessenger(
    integrations: MessengerIntegration[],
    messenger: string | null,
): MessengerIntegration[] {
    return messenger
        ? integrations.filter(integration => (integration.provider as string) === messenger)
        : [];
}
