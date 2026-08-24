import { useCallback, useEffect, useMemo, useState } from 'react';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { getVisibilityMeta } from '@/Shared/Utils/visibility';
import {
    fetchAiModelSuggestions,
    type AiModelSuggestion,
} from '@/Domains/AiModel/aiModelSuggestions';
import SuggestionPicker from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/ExpressionInput/SuggestionPicker';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import { fetchChannelSuggestions, type ChannelSuggestion } from '@/Domains/Flow/Pages/FlowEditor/utils/channelSuggestions';
import {
    fetchMailboxWatcherSuggestions,
    type WatcherSuggestion,
} from '@/Domains/Flow/Pages/FlowEditor/utils/mailboxWatcherSuggestions';
import type { ResourceFieldValueType } from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';

interface FlowInputResourceSelectProps {
    type: ResourceFieldValueType;
    value: string;
    flowId: Id;
    readOnly: boolean;
    onChange: (value: string) => void;
}

export default function FlowInputResourceSelect({
    type,
    value,
    flowId,
    readOnly,
    onChange,
}: FlowInputResourceSelectProps) {
    const quickRequirementCreation = useQuickRequirementCreation();
    const [aiModels, setAiModels] = useState<AiModelSuggestion[]>([]);
    const [channels, setChannels] = useState<ChannelSuggestion[]>([]);
    const [watchers, setWatchers] = useState<WatcherSuggestion[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const aiModelOptions = useMemo(() => aiModels.map(model => {
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
    }), [aiModels]);

    const loadSuggestions = useCallback(async (force = false) => {
        if (force) setRefreshing(true);
        else setLoading(true);
        try {
            if (type === 'ai-model') {
                setAiModels(await fetchAiModelSuggestions(force));
            } else if (type === 'channel') {
                setChannels(await fetchChannelSuggestions(force));
            } else if (type === 'mailbox-watcher') {
                setWatchers(await fetchMailboxWatcherSuggestions(flowId, force));
            }
        } finally {
            if (force) setRefreshing(false);
            else setLoading(false);
        }
    }, [flowId, type]);

    useEffect(() => {
        void loadSuggestions();
    }, [loadSuggestions]);

    if (type === 'ai-model') {
        return (
            <CustomSelect
                value={value}
                disabled={readOnly}
                loading={loading}
                options={aiModelOptions}
                searchThreshold={0}
                placeholder="Select an AI model..."
                showOptionValue={false}
                dropdownMinWidth={320}
                actionSlot={{
                    label: '+ Add AI Model',
                    onAction: async () => {
                        const model = await quickRequirementCreation.create('ai-model', {
                            requiredCapability: 'text',
                        });
                        if (model) await loadSuggestions(true);
                        return model ? String(model.id) : null;
                    },
                }}
                onRefresh={() => loadSuggestions(true)}
                refreshing={refreshing}
                onClear={() => onChange('')}
                onChange={onChange}
            />
        );
    }

    return (
        <SuggestionPicker
            type={type}
            value={value}
            readOnly={readOnly}
            loading={loading}
            channels={channels}
            watchers={watchers}
            dropdownMinWidth={320}
            onRefresh={() => loadSuggestions(true)}
            refreshing={refreshing}
            onChange={nextValue => onChange(nextValue.value)}
        />
    );
}
