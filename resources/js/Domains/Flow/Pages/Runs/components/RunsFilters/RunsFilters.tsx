import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import { promotionReason } from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/utils';
import Button from '@/Shared/UI/Button/Button';
import MainFilters from './components/MainFilters/MainFilters';
import MetadataFilters from './components/MetadataFilters/MetadataFilters';
import type { MetaFilter, MetaPresence, RunsFilters as FilterValues, RunUser } from '@/Domains/Flow/Pages/Runs/types';
import { msToSecondsInput, secondsToMs } from '@/Domains/Flow/Pages/Runs/utils';
import * as S from './styled';

export interface RunsFiltersHandle {
    changePerPage: (value: number) => void;
}

interface Props {
    filters: FilterValues;
    runUsers: RunUser[];
    perPage: number;
    onPerPageChange: (value: number) => void;
    onLoadingChange: (loading: boolean) => void;
}

const emptyMetaFilter = (): MetaFilter => ({ key: '', operator: 'contains', value: '' });

const RunsFilters = forwardRef<RunsFiltersHandle, Props>(function RunsFilters(
    { filters, runUsers, perPage, onPerPageChange, onLoadingChange },
    ref,
) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const [loading, setLoading] = useState(false);
    const [resetVersion, setResetVersion] = useState(0);
    const [flowSearch, setFlowSearch] = useState(filters.flow_search ?? '');
    const [dateFrom, setDateFrom] = useState(filters.date_from ?? '');
    const [dateTo, setDateTo] = useState(filters.date_to ?? '');
    const [durationMin, setDurationMin] = useState(msToSecondsInput(filters.duration_min_ms));
    const [durationMax, setDurationMax] = useState(msToSecondsInput(filters.duration_max_ms));
    const [selectedRunUserId, setSelectedRunUserId] = useState(filters.triggered_by ? String(filters.triggered_by) : '');
    const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set(filters.statuses ?? []));
    const [metaPresence, setMetaPresence] = useState<MetaPresence>(filters.meta_presence ?? '');
    const [metaFilters, setMetaFilters] = useState<MetaFilter[]>(
        filters.meta_filters?.length > 0 ? filters.meta_filters : [emptyMetaFilter()],
    );
    const [metaPredicate, setMetaPredicate] = useState<'and' | 'or'>(filters.meta_predicate ?? 'and');
    const metaConditionsDisabled = metaPresence === 'none';
    const metadataFilteringEnabled = settings.run_metadata_search_enabled;
    const metadataFilteringPromoted = !metadataFilteringEnabled && settings.promote_disabled_features;

    const setRequestLoading = (value: boolean) => {
        setLoading(value);
        onLoadingChange(value);
    };

    const buildFilterParams = (perPageOverride?: number) => {
        const validMetaFilters = !metadataFilteringEnabled || metaConditionsDisabled
            ? []
            : metaFilters.filter(filter => filter.key.trim() !== '');
        return {
            flow_search: flowSearch.trim() || undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            duration_min_ms: secondsToMs(durationMin),
            duration_max_ms: secondsToMs(durationMax),
            triggered_by: selectedRunUserId || undefined,
            statuses: statusFilters.size > 0 ? [...statusFilters] : undefined,
            meta_filters: validMetaFilters.length > 0 ? validMetaFilters : undefined,
            meta_predicate: validMetaFilters.length > 1 ? metaPredicate : undefined,
            meta_presence: metadataFilteringEnabled ? metaPresence || undefined : undefined,
            per_page: perPageOverride ?? perPage,
        };
    };

    const submitFilters = (perPageOverride?: number) => {
        setRequestLoading(true);
        router.get('/flows/runs', buildFilterParams(perPageOverride), {
            preserveState: true,
            preserveScroll: true,
            queryStringArrayFormat: 'indices',
            onFinish: () => setRequestLoading(false),
        });
    };

    useImperativeHandle(ref, () => ({
        changePerPage(value: number) {
            onPerPageChange(value);
            submitFilters(value);
        },
    }));

    const clearFilters = () => {
        setFlowSearch('');
        setDateFrom('');
        setDateTo('');
        setDurationMin('');
        setDurationMax('');
        setSelectedRunUserId('');
        setStatusFilters(new Set());
        setMetaPresence('');
        setMetaFilters([emptyMetaFilter()]);
        setMetaPredicate('and');
        setResetVersion(previous => previous + 1);
        setRequestLoading(true);
        router.get('/flows/runs', { per_page: perPage }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setRequestLoading(false),
        });
    };

    const toggleStatus = (status: string) => setStatusFilters(previous => {
        const next = new Set(previous);
        if (next.has(status)) next.delete(status);
        else next.add(status);
        return next;
    });
    const updateMetaFilter = (index: number, field: keyof MetaFilter, value: string) => {
        setMetaFilters(previous => previous.map((filter, filterIndex) => (
            filterIndex === index ? { ...filter, [field]: value } : filter
        )));
    };
    const removeMetaFilter = (index: number) => setMetaFilters(previous => (
        previous.length <= 1 ? [emptyMetaFilter()] : previous.filter((_, filterIndex) => filterIndex !== index)
    ));
    const activeFilterCount = statusFilters.size
        + (flowSearch.trim() ? 1 : 0)
        + (dateFrom ? 1 : 0) + (dateTo ? 1 : 0)
        + (durationMin ? 1 : 0) + (durationMax ? 1 : 0)
        + (selectedRunUserId ? 1 : 0) + (metadataFilteringEnabled && metaPresence ? 1 : 0)
        + (metadataFilteringEnabled && !metaConditionsDisabled ? metaFilters.filter(filter => filter.key.trim() !== '').length : 0);

    return (
        <S.FilterBar>
            <form onSubmit={event => { event.preventDefault(); submitFilters(); }}>
                <S.FilterBarTop>
                    <S.FilterBarTitle>
                        <Icon icon="lucide:sliders-horizontal" width={14} height={14} />
                        Filter runs
                    </S.FilterBarTitle>
                </S.FilterBarTop>
                <S.FilterBarBody>
                    <MainFilters
                        flowSearch={flowSearch}
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        durationMin={durationMin}
                        durationMax={durationMax}
                        selectedRunUserId={selectedRunUserId}
                        runUsers={runUsers}
                        statusFilters={statusFilters}
                        resetVersion={resetVersion}
                        onFlowSearchChange={setFlowSearch}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                        onDurationMinChange={setDurationMin}
                        onDurationMaxChange={setDurationMax}
                        onRunUserChange={setSelectedRunUserId}
                        onStatusToggle={toggleStatus}
                    />
                    {(metadataFilteringEnabled || metadataFilteringPromoted) && (
                        <MetadataFilters
                            disabled={!metadataFilteringEnabled}
                            disabledMessage={promotionReason(settings.disabled_feature_message)}
                            filters={metaFilters}
                            predicate={metaPredicate}
                            presence={metaPresence}
                            onAdd={() => setMetaFilters(previous => [...previous, emptyMetaFilter()])}
                            onPresenceChange={setMetaPresence}
                            onPredicateChange={setMetaPredicate}
                            onRemove={removeMetaFilter}
                            onUpdate={updateMetaFilter}
                        />
                    )}
                    <S.FilterFooter>
                        <Button size="sm" variant="secondary" type="button" disabled={activeFilterCount === 0} onClick={clearFilters}>Reset</Button>
                        <Button size="sm" type="submit" loading={loading}>Apply</Button>
                    </S.FilterFooter>
                </S.FilterBarBody>
            </form>
        </S.FilterBar>
    );
});

export default RunsFilters;
