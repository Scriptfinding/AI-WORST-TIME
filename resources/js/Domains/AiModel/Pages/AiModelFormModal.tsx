import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router } from '@inertiajs/react';
import { invalidateAiModelSuggestionsCache } from '@/Domains/AiModel/aiModelSuggestions';
import { csrfHeaders } from '@/Shared/Utils/csrf';
import { normalizeLaravelValidationErrors } from '@/Shared/Utils/laravelValidation';
import Input from '@/Shared/UI/Input/Input';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import ScopePicker, { type ScopeTeam } from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import GroupSelector from '@/Domains/NotificationChannel/Pages/ChannelFormModal/components/GroupSelector/GroupSelector';
import ConnectionSelect from '@/Domains/NotificationChannel/Pages/ChannelFormModal/components/ConnectionSelect/ConnectionSelect';
import IntegrationProviderSelector from '@/Shared/UI/IntegrationProviderSelector/IntegrationProviderSelector';
import type { ProviderMeta } from '@/Domains/NotificationChannel/Pages/ChannelFormModal/config';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import type { IntegrationProvider } from '@/Domains/Integration/types';
import { useAuth } from '@/App/Hooks/usePageProps';
import { canEditOwnership, OWNERSHIP_DISABLED_HINT } from '@/Shared/Utils/ownershipPermissions';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import type {
    AiIntegration,
    AiModel,
    CreatedAiModel,
    DiscoveredAiModel,
} from '@/Domains/AiModel/types';
import * as S from './styled';

export interface AiModelFormModalProps {
    model?: AiModel | null;
    aiIntegrations: AiIntegration[];
    groups: string[];
    teams: ScopeTeam[];
    onClose: () => void;
    onCreated?: (model: CreatedAiModel) => void;
    requiredCapability?: 'text' | 'vision';
    zIndex?: number;
    quickMode?: boolean;
}

type ModelFilter = 'all' | 'vision';

export default function AiModelFormModal({
    model,
    aiIntegrations,
    groups,
    teams,
    onClose,
    onCreated,
    requiredCapability,
    zIndex,
    quickMode,
}: AiModelFormModalProps) {
    const quickCreation = useQuickRequirementCreation();
    const { user } = useAuth();
    const editing = Boolean(model);
    const initialIntegration = aiIntegrations.find(integration => integration.id === model?.ai_integration_id);
    const [name, setName] = useState(model?.name ?? '');
    const [aiIntegrationId, setAiIntegrationId] = useState<Id | null>(initialIntegration?.id ?? null);
    const [selectedModelId, setSelectedModelId] = useState(() => model?.ai_model_id ?? '');
    const [vendor, setVendor] = useState<string | null>(
        () => initialIntegration?.provider as string | undefined ?? null,
    );
    const [scope, setScope] = useState(model?.scope ?? 'user');
    const [teamId, setTeamId] = useState<Id | null>(model?.team_id ?? null);
    const [ownerId, setOwnerId] = useState<Id | null>(model?.user_id ?? null);
    const [group, setGroup] = useState(model?.group ?? '');
    const effectiveRequiredCapability = requiredCapability ?? (quickMode ? 'vision' : undefined);
    const initialModelFilter = effectiveRequiredCapability === 'vision' ? 'vision' : 'all';
    const [modelFilter, setModelFilter] = useState<ModelFilter>(initialModelFilter);
    const [models, setModels] = useState<DiscoveredAiModel[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [discoveryError, setDiscoveryError] = useState('');
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);
    const selectedIntegration = aiIntegrations.find(integration => integration.id === aiIntegrationId);
    const vendors = useMemo(
        () => [...new Set(aiIntegrations.map(integration => integration.provider as string))],
        [aiIntegrations],
    );
    const vendorIntegrations = useMemo(
        () => aiIntegrations.filter(integration => integration.provider === vendor),
        [aiIntegrations, vendor],
    );
    const vendorMeta = useMemo(() => Object.fromEntries(vendors.map(provider => {
        const config = getProviderConfig(provider as AiIntegration['provider']);
        return [provider, {
            icon: config?.icon ?? 'lucide:bot',
            label: config?.label ?? provider,
            color: config?.color ?? '#888',
        } satisfies ProviderMeta];
    })), [vendors]);
    const ownershipDisabled = Boolean(model && user && !canEditOwnership({
        currentUserId: user.id,
        currentUserWorkspaceRole: user.workspace_role,
        resourceOwnerId: model.user_id,
        ownerWorkspaceRole: model.owner_workspace_role,
    }));

    useEffect(() => {
        if (!aiIntegrationId) {
            setModels([]);
            return;
        }
        const controller = new AbortController();
        const timeout = window.setTimeout(async () => {
            setLoadingModels(true);
            setDiscoveryError('');
            try {
                const params = new URLSearchParams({ ai_integration_id: String(aiIntegrationId) });
                const response = await fetch(`/ai-models/discover?${params}`, { signal: controller.signal });
                const payload = await response.json().catch(() => ({}));
                if (!response.ok) throw new Error(payload.message ?? 'Unable to discover models.');
                const discovered = Array.isArray(payload.models) ? payload.models : [];
                setModels(discovered);
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    setDiscoveryError((error as Error).message);
                }
            } finally {
                if (!controller.signal.aborted) setLoadingModels(false);
            }
        }, 250);
        return () => {
            window.clearTimeout(timeout);
            controller.abort();
        };
    }, [aiIntegrationId, model]);

    const visibleModels = useMemo(() => {
        const discoveredIds = new Set(models.map(remoteModel => remoteModel.id));
        const missingSelected = model?.ai_model_id && !discoveredIds.has(model.ai_model_id)
            ? [{
                id: model.ai_model_id,
                label: model.ai_model_id,
                capabilities: model.capabilities,
            }]
            : [];
        return [...missingSelected, ...models];
    }, [model?.ai_model_id, model?.capabilities, models]);
    const capabilityModels = useMemo(() => visibleModels.filter(remoteModel => (
        effectiveRequiredCapability
            ? remoteModel.capabilities?.[effectiveRequiredCapability] === true
            : remoteModel.capabilities?.text === true || remoteModel.capabilities?.vision === true
    )), [effectiveRequiredCapability, visibleModels]);
    const filteredModels = useMemo(() => capabilityModels.filter(remoteModel => {
        if (modelFilter === 'vision') return remoteModel.capabilities?.vision === true;
        return true;
    }), [capabilityModels, modelFilter]);
    const modelOptions = useMemo(() => filteredModels.map(remoteModel => ({
        value: remoteModel.id,
        label: remoteModel.label || remoteModel.id,
        detail: remoteModel.capabilities?.vision ? 'Vision' : undefined,
        icon: remoteModel.capabilities?.vision ? 'lucide:scan-eye' : 'lucide:message-square-text',
    })), [filteredModels]);
    const hasSelectedRequiredModel = Boolean(selectedModelId) && (
        !effectiveRequiredCapability
        || visibleModels.find(remoteModel => remoteModel.id === selectedModelId)
            ?.capabilities?.[effectiveRequiredCapability] === true
    );
    const canSubmit = Boolean(
        name
        && aiIntegrationId
        && selectedModelId
        && hasSelectedRequiredModel,
    );

    const handleSubmit = async (event: FormEvent) => {
        event.preventDefault();
        if (!canSubmit) return;

        setSaving(true);
        const payload = {
            name,
            ai_integration_id: aiIntegrationId,
            ai_model_id: selectedModelId,
            scope,
            team_id: scope === 'team' ? teamId : null,
            group: group || null,
            user_id: ownerId,
        };
        const options = {
            preserveScroll: true,
            onSuccess: () => {
                invalidateAiModelSuggestionsCache();
                onClose();
            },
            onError: (nextErrors: Record<string, string>) => setErrors(nextErrors),
            onFinish: () => setSaving(false),
        };
        if (model) {
            router.put(`/ai-models/${model.id}`, payload, options);
        } else if (onCreated) {
            setErrors({});
            try {
                const response = await fetch('/ai-models', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        ...csrfHeaders(),
                    },
                    body: JSON.stringify(payload),
                });
                const data = await response.json().catch(() => ({})) as {
                    ai_model?: CreatedAiModel;
                    message?: string;
                    errors?: unknown;
                };
                if (!response.ok || !data.ai_model) {
                    const nextErrors = normalizeLaravelValidationErrors(data.errors);
                    setErrors(Object.keys(nextErrors).length > 0
                        ? nextErrors
                        : { name: data.message || 'Unable to create the AI model.' });
                    return;
                }
                invalidateAiModelSuggestionsCache();
                onCreated(data.ai_model);
            } catch {
                setErrors({ name: 'Unable to create the AI model.' });
            } finally {
                setSaving(false);
            }
        } else {
            router.post('/ai-models', payload, options);
        }
    };

    const createIntegration = async () => {
        if (!quickCreation.available) {
            router.visit('/integrations');
            return;
        }

        const integration = await quickCreation.create('integration', { category: 'ai' });
        if (!integration) return;
        await quickCreation.refresh('integrations');
        setVendor(integration.provider);
        setAiIntegrationId(integration.id);
        setSelectedModelId('');
        setModelFilter(initialModelFilter);
    };

    return (
        <Modal
            isOpen
            onClose={onClose}
            title={editing ? 'Edit AI Model' : 'New AI Model'}
            caption="Expose a configured AI model to flows through a stable ID."
            width="560px"
            zIndex={zIndex}
            modalKind={quickMode ? 'ai-model-quick-create' : undefined}
        >
            <S.Form onSubmit={handleSubmit}>
                {aiIntegrations.length === 0 ? (
                    <div>
                        <S.Label>AI integration</S.Label>
                        <S.EmptyIntegrationResult>
                            <S.EmptyIntegrationResultContent>
                                <Icon icon="lucide:info" width={14} />
                                No AI integrations found.
                            </S.EmptyIntegrationResultContent>
                            <Button
                                type="button"
                                variant="secondary"
                                size="sm"
                                onClick={() => void createIntegration()}
                            >
                                + Add integration
                            </Button>
                        </S.EmptyIntegrationResult>
                    </div>
                ) : (
                    <>
                        <IntegrationProviderSelector
                            providers={vendors}
                            value={vendor}
                            label="Vendor"
                            providerMeta={vendorMeta}
                            category="ai"
                            emptyMessage="No AI integrations found."
                            onChange={nextVendor => {
                                setVendor(nextVendor);
                                setAiIntegrationId(null);
                                setSelectedModelId('');
                                setModelFilter(initialModelFilter);
                            }}
                        />
                        {vendor && (
                            <div>
                                <ConnectionSelect
                                    integrations={vendorIntegrations}
                                    value={aiIntegrationId}
                                    providerName={vendor}
                                    providerMeta={vendorMeta[vendor]}
                                    creationProvider={vendor as IntegrationProvider}
                                    creationCategory="ai"
                                    onChange={id => {
                                        setAiIntegrationId(id);
                                        setSelectedModelId('');
                                        setModelFilter(initialModelFilter);
                                    }}
                                />
                                {errors.ai_integration_id && <S.ErrorText>{errors.ai_integration_id}</S.ErrorText>}
                            </div>
                        )}
                    </>
                )}

                {selectedIntegration && (
                    <div>
                        <S.Label>AI model</S.Label>
                        <CustomSelect
                            value={selectedModelId}
                            options={modelOptions}
                            disabled={loadingModels}
                            searchThreshold={0}
                            showOptionValue={false}
                            placeholder={loadingModels ? 'Discovering models...' : 'Select an AI model...'}
                            dropdownMinWidth={360}
                            headerSlot={(
                                <S.ModelFilters>
                                    {([
                                        ['all', 'All Models', 'lucide:list-filter'],
                                        ['vision', 'Vision', 'lucide:scan-eye'],
                                    ] as const).map(([filter, label, icon]) => (
                                        <S.ModelFilterButton
                                            key={filter}
                                            type="button"
                                            $active={modelFilter === filter}
                                            onMouseDown={event => event.preventDefault()}
                                            onClick={() => setModelFilter(filter)}
                                        >
                                            <Icon icon={icon} width={12} />
                                            {label}
                                        </S.ModelFilterButton>
                                    ))}
                                </S.ModelFilters>
                            )}
                            onChange={setSelectedModelId}
                        />
                        {discoveryError && <S.ErrorText>{discoveryError}</S.ErrorText>}
                        {!loadingModels && !discoveryError && modelOptions.length === 0 && (
                            <S.PickerState>No models found.</S.PickerState>
                        )}
                        {errors.ai_model_id && <S.ErrorText>{errors.ai_model_id}</S.ErrorText>}
                    </div>
                )}

                <div>
                    <Input
                        label="Label"
                        value={name}
                        onChange={event => {
                            setName(event.target.value);
                            setErrors(current => ({ ...current, name: '' }));
                        }}
                        error={errors.name}
                        placeholder="Primary AI"
                    />
                </div>

                <GroupSelector groups={groups} value={group} onChange={setGroup} />
                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    onChange={value => {
                        setScope(value.scope as AiModel['scope']);
                        setTeamId(value.team_id);
                    }}
                    teams={teams}
                    ownerLabel="Owner"
                    ownerScope="user"
                    disabled={ownershipDisabled}
                    disabledHint={OWNERSHIP_DISABLED_HINT}
                />
                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={setOwnerId}
                    placeholder="Myself (default)"
                    disabled={ownershipDisabled}
                />
                {(errors.config || errors.user_id || errors.team_id) && (
                    <S.ErrorText>{errors.config || errors.user_id || errors.team_id}</S.ErrorText>
                )}
                <S.FormActions>
                    <Button type="button" variant="secondary" size="sm" onClick={onClose}>Cancel</Button>
                    <Button
                        type="submit"
                        size="sm"
                        loading={saving}
                        disabled={!canSubmit}
                    >
                        {editing ? 'Save Model' : 'Create Model'}
                    </Button>
                </S.FormActions>
            </S.Form>
        </Modal>
    );
}
