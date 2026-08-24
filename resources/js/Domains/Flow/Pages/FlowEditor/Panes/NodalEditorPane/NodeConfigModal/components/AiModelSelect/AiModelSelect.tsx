import { useMemo, useState } from 'react';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { getVisibilityMeta } from '@/Shared/Utils/visibility';
import {
    useNodeValidationResources,
    useRefreshNodeValidationResources,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/NodeValidationContext';
import {
    useQuickRequirementCreation,
    type AiRequiredCapability,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';

interface Props {
    kind: 'ai-model' | 'ai-vision-model';
    value: string;
    disabled?: boolean;
    invalid?: boolean;
    createCapability?: AiRequiredCapability;
    onChange: (value: string) => void;
}

export default function AiModelSelect({
    kind,
    value,
    disabled,
    invalid,
    createCapability,
    onChange,
}: Props) {
    const { aiModels } = useNodeValidationResources();
    const refreshResources = useRefreshNodeValidationResources();
    const quickRequirementCreation = useQuickRequirementCreation();
    const [refreshing, setRefreshing] = useState(false);
    const models = useMemo(() => aiModels?.items ?? [], [aiModels]);
    const loading = aiModels?.status === 'loading';

    const options = useMemo(() => {
        return models
            .filter(model => kind === 'ai-vision-model'
                ? model.capabilities.vision === true
                : model.capabilities.text === true)
            .map(model => {
                const provider = getProviderConfig(model.ai_integration.provider as IntegrationProvider);
                const visibility = getVisibilityMeta(model.scope, model.team_name);

                return {
                    value: String(model.id),
                    label: model.name,
                    detail: visibility ? `${visibility.label} · ${model.ai_model_id}` : model.ai_model_id,
                    detailIcon: visibility?.icon,
                    icon: provider?.icon,
                    iconColor: provider?.color,
                };
            });
    }, [kind, models]);

    const refresh = async () => {
        setRefreshing(true);
        try {
            await refreshResources();
        } finally {
            setRefreshing(false);
        }
    };

    return (
        <CustomSelect
            value={value}
            disabled={disabled || loading}
            invalid={invalid}
            options={options}
            searchThreshold={0}
            placeholder="Select an AI model..."
            showOptionValue={false}
            actionSlot={createCapability ? {
                label: '+ Add AI Model',
                onAction: async () => {
                    const model = await quickRequirementCreation.create('ai-model', {
                        requiredCapability: createCapability,
                    });
                    if (model) await refresh();
                    return model ? String(model.id) : null;
                },
            } : undefined}
            onRefresh={refresh}
            refreshing={refreshing}
            onClear={() => onChange('')}
            onChange={onChange}
        />
    );
}
