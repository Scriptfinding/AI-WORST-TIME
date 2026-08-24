import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import type { Integration } from '@/Domains/Integration/types';

export type GenerationRef = { current: number };

interface OptionsLoadInput<T> {
    url: string;
    signal: AbortSignal;
    isCurrent: () => boolean;
    parse: (response: Response) => Promise<T[]>;
    setOptions: (options: T[]) => void;
    setLoading: (loading: boolean) => void;
}

export function buildVaultTypeOptions(vaultIntegrations: Integration[]): { value: string; label: string }[] {
    const options: { value: string; label: string }[] = [];
    const seen = new Set<string>();
    for (const integration of vaultIntegrations) {
        if (seen.has(integration.provider)) continue;
        seen.add(integration.provider);
        const config = getProviderConfig(integration.provider);
        options.push({
            value: `vault:${integration.provider}`,
            label: config?.label || integration.provider,
        });
    }
    return options;
}

export function createLoadScope(generations: GenerationRef[]) {
    const controller = new AbortController();
    const snapshots = new Map(
        generations.map(generation => [generation, ++generation.current]),
    );
    let active = true;

    return {
        signal: controller.signal,
        isCurrent: (generation: GenerationRef) => (
            active && generation.current === snapshots.get(generation)
        ),
        abort: () => {
            active = false;
            controller.abort();
        },
    };
}

export async function loadOptions<T>({
    url,
    signal,
    isCurrent,
    parse,
    setOptions,
    setLoading,
}: OptionsLoadInput<T>): Promise<boolean> {
    try {
        const options = await fetch(url, { signal }).then(parse);

        if (!isCurrent()) return false;

        setOptions(options);
        return true;
    } catch {
        if (isCurrent()) setOptions([]);
        return false;
    } finally {
        if (isCurrent()) setLoading(false);
    }
}

export function parseOptions<T>(response: Response) {
    return response.json() as Promise<T[]>;
}

export function getVaultsUrl(integrationId: Id) {
    return `/integrations/${encodeURIComponent(integrationId)}/vaults`;
}

export function getVaultItemsUrl(
    integrationId: Id,
    vaultId: string,
) {
    return `${getVaultsUrl(integrationId)}/${encodeURIComponent(vaultId)}/items`;
}

export function getVaultFieldsUrl(
    integrationId: Id,
    vaultId: string,
    itemId: string,
) {
    return `${getVaultItemsUrl(integrationId, vaultId)}/${encodeURIComponent(itemId)}/fields`;
}
