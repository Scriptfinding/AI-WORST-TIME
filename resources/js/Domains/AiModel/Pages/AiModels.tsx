import React, { useEffect, useMemo, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import axios from 'axios';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import type { PageProps } from '@/App/types';
import { useAuth, useCurrentWorkspace } from '@/App/Hooks/usePageProps';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import { getProviderConfig } from '@/Domains/Integration/Pages/providerConfig';
import { IntegrationCreationProvider } from '@/Domains/Integration/Contexts/IntegrationCreationContext';
import type { Flow } from '@/Domains/Flow/types';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import FlowIcon from '@/Shared/UI/FlowIcon/FlowIcon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import BulkDeleteConfirmation from '@/Shared/UI/BulkDeleteConfirmation/BulkDeleteConfirmation';
import FilterDropdown from '@/Shared/UI/TableFilters/FilterDropdown';
import {
    buildGroupOptions,
    buildScopeOptions,
    getScopeIcon,
    getSelectedGroupLabel,
    getSelectedScopeLabel,
} from '@/Shared/UI/TableFilters/options';
import { useTableFilters } from '@/Shared/UI/TableFilters/useTableFilters';
import { useCollapsedGroups } from '@/Shared/UI/TableFilters/useCollapsedGroups';
import { groupHierarchicalItems } from '@/Shared/Utils/groupHierarchicalItems';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useUrlSyncedModal } from '@/Shared/Hooks/useUrlSyncedModal';
import { invalidateAiModelSuggestionsCache } from '@/Domains/AiModel/aiModelSuggestions';
import type {
    AiIntegration,
    AiModel,
    AiModelFilters,
    AiModelUsage,
} from '@/Domains/AiModel/types';
import AiModelFormModal from './AiModelFormModal';
import { AiModelDeleteConfirmation } from './AiModelUsageConfirmation';
import * as S from './styled';

interface Team {
    id: string;
    name: string;
}

interface Props {
    aiModels: AiModel[];
    groups: string[];
    aiIntegrations: AiIntegration[];
    teams: Team[];
    filters: AiModelFilters;
    isAdmin: boolean;
}

const COLUMN_COUNT = 8;

export default function AiModels({ aiModels, groups, aiIntegrations, teams, filters, isAdmin }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const { user } = useAuth();
    const currentWorkspace = useCurrentWorkspace();
    const { confirm, ConfirmModal } = useConfirm();
    const {
        selectedItem: editingModel,
        openModal: openEditingModel,
        closeModal: closeEditingModel,
    } = useUrlSyncedModal(aiModels, 'edit');
    const [isModelFormOpen, setIsModelFormOpen] = useState(() => editingModel !== null);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const [deleting, setDeleting] = useState(false);
    const [inspectModel, setInspectModel] = useState<AiModel | null>(null);
    const [inspectUsages, setInspectUsages] = useState<AiModelUsage[]>([]);
    const [inspectLoading, setInspectLoading] = useState(false);
    const tableFilters = useTableFilters({ filters, route: '/ai-models' });
    const groupOptions = buildGroupOptions(groups);
    const scopeOptions = useMemo(
        () => buildScopeOptions(teams, settings.workspace_sharing_enabled, 'My models'),
        [settings.workspace_sharing_enabled, teams],
    );
    const { collapsedGroups, isGroupHidden, toggleGroup } = useCollapsedGroups(
        `ai-model-collapsed-groups:${user?.id ?? 'anonymous'}`,
    );
    const sections = useMemo(
        () => groupHierarchicalItems(aiModels, model => model.group),
        [aiModels],
    );

    useEffect(() => {
        const available = new Set(aiModels.map(model => model.id));
        setSelectedIds(current => new Set([...current].filter(id => available.has(id))));
    }, [aiModels]);

    useEffect(() => {
        if (editingModel) setIsModelFormOpen(true);
    }, [editingModel]);

    useEffect(() => {
        if (!inspectModel) return;

        let cancelled = false;
        setInspectUsages([]);
        setInspectLoading(true);

        axios.get<AiModelUsage[]>(`/ai-models/${inspectModel.id}/usages`)
            .then(({ data }) => {
                if (!cancelled) setInspectUsages(Array.isArray(data) ? data : []);
            })
            .catch(() => {
                // Keep the empty state when usage inspection is unavailable.
            })
            .finally(() => {
                if (!cancelled) setInspectLoading(false);
            });

        return () => {
            cancelled = true;
        };
    }, [inspectModel]);

    const canManage = (model: AiModel) => isAdmin || model.user_id === user?.id;
    const toggleSelected = (id: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const loadUsages = async (model: AiModel): Promise<AiModelUsage[]> => {
        try {
            const response = await axios.get<AiModelUsage[]>(`/ai-models/${model.id}/usages`);
            return Array.isArray(response.data) ? response.data : [];
        } catch {
            return [];
        }
    };

    const confirmDelete = async (models: AiModel[]) => {
        if (models.length === 1) {
            const [model] = models;
            const usages = await loadUsages(model);

            return confirm({
                title: 'Delete AI Model',
                message: <AiModelDeleteConfirmation modelName={model.name} usages={usages} />,
                confirmLabel: 'Delete',
                variant: 'danger',
            });
        }

        const usages = await Promise.all(models.map(loadUsages));
        const usageCount = usages.reduce((total, modelUsages) => total + modelUsages.length, 0);
        return confirm({
            title: models.length === 1 ? 'Delete AI Model' : 'Delete AI Models',
            message: (
                <BulkDeleteConfirmation
                    description="Flows using these IDs may stop working."
                    items={models.map((model, index) => ({
                        id: model.id,
                        title: model.name,
                        subtitle: usages[index].length > 0
                            ? `Used in ${usages[index].length} flow(s)`
                            : `${model.ai_integration?.name ?? 'AI integration'} - ${model.ai_model_id}`,
                        icon: <Icon icon="lucide:bot" width={21} />,
                    }))}
                    warning={usageCount > 0
                        ? `${usageCount} flow reference(s) will be left unresolved. This action cannot be undone.`
                        : 'This action cannot be undone.'}
                />
            ),
            confirmLabel: models.length === 1 ? 'Delete' : `Delete (${models.length})`,
            variant: 'danger',
        });
    };

    const deleteOne = async (model: AiModel) => {
        if (!await confirmDelete([model])) return;
        router.delete(`/ai-models/${model.id}`, {
            preserveScroll: true,
            onSuccess: invalidateAiModelSuggestionsCache,
        });
    };

    const deleteSelected = async () => {
        const models = aiModels.filter(model => selectedIds.has(model.id));
        if (models.length === 0 || !await confirmDelete(models)) return;
        setDeleting(true);
        router.delete('/ai-models/bulk-delete', {
            data: { ids: models.map(model => model.id) },
            preserveScroll: true,
            onSuccess: () => {
                invalidateAiModelSuggestionsCache();
                setSelectedIds(new Set());
            },
            onFinish: () => setDeleting(false),
        });
    };

    const toggleActive = (model: AiModel) => {
        router.put(`/ai-models/${model.id}`, { is_active: !model.is_active }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: invalidateAiModelSuggestionsCache,
        });
    };

    const renderRow = (model: AiModel, indent: number) => {
        const manageable = canManage(model);
        const configuredModel = model;
        const provider = model.ai_integration
            ? getProviderConfig(model.ai_integration.provider)
            : undefined;
        const scopeLabel = model.scope === 'workspace'
            ? 'Workspace'
            : model.scope === 'team'
                ? `Team: ${model.team?.name ?? '-'}`
                : 'Personal';
        return (
            <tr key={model.id}>
                <S.Td $indent={indent}>
                    <TableCellContent>
                        <S.Identity>
                            {manageable && (
                                <AvatarSelectionToggle
                                    selected={selectedIds.has(model.id)}
                                    onChange={() => toggleSelected(model.id)}
                                    label={`${selectedIds.has(model.id) ? 'Deselect' : 'Select'} ${model.name}`}
                                    size={24}
                                >
                                    <S.ReferenceIcon>
                                        <Icon icon={provider?.icon ?? 'lucide:bot'} width={13} />
                                    </S.ReferenceIcon>
                                </AvatarSelectionToggle>
                            )}
                            <S.Reference>{model.name}</S.Reference>
                        </S.Identity>
                    </TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent>
                        <S.ProviderBadge $color={provider?.color}>
                            <Icon icon={provider?.icon ?? 'lucide:bot'} width={14} />
                            {provider?.label ?? model.ai_integration?.provider ?? '-'}
                        </S.ProviderBadge>
                    </TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent>
                        {model.ai_integration ? (
                            <S.ConnectionName>
                                <Icon icon="lucide:plug" width={12} />
                                {model.ai_integration.name}
                            </S.ConnectionName>
                        ) : (
                            <S.ConnectionMissing>-</S.ConnectionMissing>
                        )}
                    </TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent>
                        <S.ModelName title={configuredModel.ai_model_id}>
                            {configuredModel.ai_model_id}
                            {configuredModel.capabilities?.vision && (
                                <S.Capability title="Supports browser screenshots">
                                    <Icon icon="lucide:scan-eye" width={14} />
                                </S.Capability>
                            )}
                        </S.ModelName>
                    </TableCellContent>
                </S.Td>
                <S.Td $center>
                    <TableCellContent $align="center">
                        <S.Status $active={model.is_active}>{model.is_active ? 'Active' : 'Inactive'}</S.Status>
                    </TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent>
                        <S.Scope $scope={model.scope} $color={currentWorkspace?.icon_color || undefined}>
                            <Icon icon={model.scope === 'workspace' ? 'lucide:building-2' : model.scope === 'team' ? 'lucide:users-round' : 'lucide:user'} width={10} />
                            {scopeLabel}
                        </S.Scope>
                    </TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent><S.OwnerName>{model.user?.name ?? '-'}</S.OwnerName></TableCellContent>
                </S.Td>
                <S.Td>
                    <TableCellContent>
                        {manageable && (
                            <S.Actions>
                                <S.IconButton type="button" onClick={() => setInspectModel(model)} title="Inspect usages">
                                    <Icon icon="lucide:scan-search" width={14} />
                                </S.IconButton>
                                <S.IconButton type="button" onClick={() => toggleActive(model)} title={model.is_active ? 'Disable' : 'Enable'}>
                                    <Icon icon={model.is_active ? 'lucide:pause' : 'lucide:play'} width={14} />
                                </S.IconButton>
                                <S.IconButton
                                    type="button"
                                    onClick={() => {
                                        openEditingModel(model);
                                        setIsModelFormOpen(true);
                                    }}
                                    title="Edit"
                                >
                                    <Icon icon="lucide:pencil" width={14} />
                                </S.IconButton>
                                <S.DangerIconButton type="button" onClick={() => deleteOne(model)} title="Delete">
                                    <Icon icon="lucide:trash-2" width={14} />
                                </S.DangerIconButton>
                            </S.Actions>
                        )}
                    </TableCellContent>
                </S.Td>
            </tr>
        );
    };

    return (
        <IntegrationCreationProvider
            teams={teams}
            integrationReloadKeys={['aiIntegrations']}
        >
        <AppLayout
            title="AI Models"
            headerRight={settings.ai_enabled ? (
                <S.HeaderActions>
                    {selectedIds.size > 0 && (
                        <Button size="sm" variant="danger" loading={deleting} onClick={deleteSelected}>
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button
                        size="sm"
                        onClick={() => {
                            closeEditingModel();
                            setIsModelFormOpen(true);
                        }}
                    >
                        <Icon icon="lucide:plus" width={14} />
                        New Model
                    </Button>
                </S.HeaderActions>
            ) : undefined}
        >
            {!settings.ai_enabled ? (
                <FeatureUnavailablePanel />
            ) : (
                <>
                    <S.BetaBanner>
                        <S.BetaBannerIcon>
                            <Icon icon="lucide:flask-conical" width={19} aria-hidden="true" />
                        </S.BetaBannerIcon>
                        <S.BetaBannerContent>
                            <S.BetaBannerTitle>
                                AI Models
                                <S.BetaBadge>Beta</S.BetaBadge>
                            </S.BetaBannerTitle>
                            <S.BetaBannerDescription>
                                Provider compatibility and AI behavior may evolve. Validate critical automations before using them in production.
                            </S.BetaBannerDescription>
                        </S.BetaBannerContent>
                    </S.BetaBanner>
                    <S.Toolbar>
                        <S.SearchBar onSubmit={event => { event.preventDefault(); tableFilters.applyFilters(); }}>
                            <Icon icon="lucide:search" width={14} />
                            <S.SearchInput
                                value={tableFilters.search}
                                onChange={event => tableFilters.setSearch(event.target.value)}
                                placeholder="Search AI models..."
                            />
                            {tableFilters.search && (
                                <S.IconButton
                                    type="button"
                                    onClick={() => {
                                        tableFilters.setSearch('');
                                        tableFilters.applyFilters({ search: null });
                                    }}
                                >
                                    <Icon icon="lucide:x" width={12} />
                                </S.IconButton>
                            )}
                        </S.SearchBar>
                        {groups.length > 0 && (
                            <FilterDropdown
                                emptyLabel="No groups found"
                                onSelect={value => tableFilters.applyFilters({ group: value === '__all__' ? null : value })}
                                options={groupOptions}
                                searchPlaceholder="Search groups..."
                                selectedValue={filters.group ?? '__all__'}
                                triggerIcon="lucide:folder"
                                triggerLabel={getSelectedGroupLabel(filters.group)}
                            />
                        )}
                        <FilterDropdown
                            emptyLabel="No scopes found"
                            onSelect={value => tableFilters.applyFilters({ scope: value === '__all__' ? null : value })}
                            options={scopeOptions}
                            searchPlaceholder="Search scopes..."
                            sections={[{ value: 'team', label: 'Teams' }]}
                            selectedValue={filters.scope ?? '__all__'}
                            triggerIcon={getScopeIcon(filters.scope)}
                            triggerLabel={getSelectedScopeLabel(filters.scope, scopeOptions)}
                        />
                    </S.Toolbar>
                    {tableFilters.hasActiveFilters && (
                        <S.ResetBanner type="button" onClick={tableFilters.resetFilters}>
                            <Icon icon="lucide:filter-x" width={14} /> Filtered results, click to reset
                        </S.ResetBanner>
                    )}

                    {aiModels.length === 0 ? (
                        <S.Empty>
                            {tableFilters.hasActiveFilters
                                ? 'No AI models match your filters.'
                                : 'No AI models configured yet.'}
                        </S.Empty>
                    ) : (
                        <S.TableWrapper>
                            <S.Table>
                                <thead>
                                    <tr>
                                        <S.Th>Name</S.Th>
                                        <S.Th>Provider</S.Th>
                                        <S.Th>Connection</S.Th>
                                        <S.Th>Model</S.Th>
                                        <S.Th $center>Status</S.Th>
                                        <S.Th>Visibility</S.Th>
                                        <S.Th>Owner</S.Th>
                                        <S.Th $width={132} />
                                    </tr>
                                </thead>
                                <tbody>
                                    {sections.map((section, sectionIndex) => {
                                        const lastHeader = section.headers[section.headers.length - 1];
                                        const itemIndent = lastHeader ? (lastHeader.depth + 1) * 16 : 0;
                                        const hideItems = section.group ? isGroupHidden(section.group) : false;
                                        const visibleHeaders = section.headers.filter(header => {
                                            const parentKey = header.key.split('/').slice(0, -1).join('/');
                                            return !parentKey || !isGroupHidden(parentKey);
                                        });
                                        if (hideItems && visibleHeaders.length === 0) return null;

                                        return (
                                            <React.Fragment key={sectionIndex}>
                                                {visibleHeaders.map(header => (
                                                    <S.GroupRow key={header.key}>
                                                        <td colSpan={COLUMN_COUNT}>
                                                            <S.GroupHeaderButton type="button" $depth={header.depth} onClick={() => toggleGroup(header.key)}>
                                                                <Icon icon={collapsedGroups.has(header.key) ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={12} />
                                                                <Icon icon="lucide:folder" width={12} />
                                                                <span>{header.label}</span>
                                                                <S.GroupCount>({header.count})</S.GroupCount>
                                                            </S.GroupHeaderButton>
                                                        </td>
                                                    </S.GroupRow>
                                                ))}
                                                {!hideItems && section.items.map(model => renderRow(model, itemIndent))}
                                            </React.Fragment>
                                        );
                                    })}
                                </tbody>
                            </S.Table>
                        </S.TableWrapper>
                    )}
                    {isModelFormOpen && (
                        <AiModelFormModal
                            model={editingModel}
                            aiIntegrations={aiIntegrations}
                            groups={groups}
                            teams={teams}
                            onClose={() => {
                                setIsModelFormOpen(false);
                                closeEditingModel();
                            }}
                        />
                    )}
                    <Modal
                        isOpen={!!inspectModel}
                        onClose={() => setInspectModel(null)}
                        title={`Usages - ${inspectModel?.name ?? ''}`}
                        width="480px"
                    >
                        {inspectModel && (
                            <S.InspectContent>
                                {inspectLoading ? (
                                    <S.InspectLoading>
                                        <Icon icon="lucide:loader-2" width={16} />
                                        Loading usages...
                                    </S.InspectLoading>
                                ) : inspectUsages.length === 0 ? (
                                    <S.InspectEmpty>
                                        <Icon icon="lucide:check-circle" width={16} />
                                        This AI model is not used in any flow.
                                    </S.InspectEmpty>
                                ) : (
                                    <>
                                        <S.InspectCount>
                                            Used in {inspectUsages.length} flow{inspectUsages.length > 1 ? 's' : ''}
                                        </S.InspectCount>
                                        <S.InspectList>
                                            {inspectUsages.map(usage => (
                                                <S.InspectItem key={usage.flow_id} href={`/flows/${usage.flow_id}`} target="_blank" rel="noopener noreferrer">
                                                    <S.InspectItemLabel>
                                                        <FlowIcon flow={{ name: usage.flow_name, icon_type: (usage.icon_type as Flow['icon_type']) || 'emoji', icon_value: usage.icon_value ?? null, icon_color: usage.icon_color ?? null, icon_url: usage.icon_url ?? null }} size={16} />
                                                        <S.InspectItemName>{usage.flow_name}</S.InspectItemName>
                                                    </S.InspectItemLabel>
                                                    <S.InspectItemEnd><Icon icon="lucide:external-link" width={13} /></S.InspectItemEnd>
                                                </S.InspectItem>
                                            ))}
                                        </S.InspectList>
                                    </>
                                )}
                            </S.InspectContent>
                        )}
                    </Modal>
                </>
            )}
            <ConfirmModal />
        </AppLayout>
        </IntegrationCreationProvider>
    );
}
