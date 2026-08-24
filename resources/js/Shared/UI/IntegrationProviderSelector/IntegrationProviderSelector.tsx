import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

interface ProviderMeta {
    label: string;
    icon: string;
    color: string;
}

interface Props {
    providers: string[];
    value: string | null;
    onChange: (provider: string) => void;
    label: string;
    providerMeta: Record<string, ProviderMeta>;
    category: 'ai' | 'messenger';
    emptyMessage: string;
    onIntegrationCreated?: (provider: string, integrationId: Id) => void;
}

export default function IntegrationProviderSelector({
    providers,
    value,
    onChange,
    label,
    providerMeta,
    category,
    emptyMessage,
    onIntegrationCreated,
}: Props) {
    const quickCreation = useQuickRequirementCreation();
    const createIntegration = async () => {
        if (!quickCreation.available) {
            router.visit('/integrations');
            return;
        }
        const integration = await quickCreation.create('integration', { category });
        if (!integration) return;

        await quickCreation.refresh('integrations');
        if (onIntegrationCreated) {
            onIntegrationCreated(integration.provider, integration.id);
        } else {
            onChange(integration.provider);
        }
    };

    return (
        <div>
            <S.Label>{label}</S.Label>
            {providers.length === 0 ? (
                <S.EmptyResult>
                    <S.EmptyResultContent>
                        <Icon icon="lucide:info" width={14} />
                        {emptyMessage}
                    </S.EmptyResultContent>
                    <Button type="button" variant="secondary" size="sm" onClick={() => void createIntegration()}>
                        + Add integration
                    </Button>
                </S.EmptyResult>
            ) : (
                <S.Pills>
                    {providers.map(provider => {
                        const meta = providerMeta[provider];
                        return (
                            <S.Pill
                                key={provider}
                                type="button"
                                $active={value === provider}
                                $color={meta?.color || '#888'}
                                onClick={() => onChange(provider)}
                            >
                                <Icon
                                    icon={meta?.icon || 'lucide:bot'}
                                    width={16}
                                    height={16}
                                    style={{ color: meta?.color, fill: meta?.color }}
                                />
                                {meta?.label || provider}
                            </S.Pill>
                        );
                    })}
                </S.Pills>
            )}
        </div>
    );
}
