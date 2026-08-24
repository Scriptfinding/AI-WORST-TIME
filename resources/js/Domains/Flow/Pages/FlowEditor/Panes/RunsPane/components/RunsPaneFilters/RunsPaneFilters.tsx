import { forwardRef, useImperativeHandle, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { router, usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import { promotionReason } from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/utils';
import Button from '@/Shared/UI/Button/Button';
import DateFilters from './DateFilters/DateFilters';
import MetaFilters from './MetaFilters/MetaFilters';
import PresenceFilters from './PresenceFilters/PresenceFilters';
import StatusFilters from './StatusFilters/StatusFilters';
import {
    emptyMetaFilter,
    type MetaFilter,
    type MetaPredicate,
    type MetaPresence,
} from './types';
import * as S from './styled';

interface Props {
    perPage: number;
    onLoadingChange: (loading: boolean) => void;
}

export interface RunsPaneFiltersHandle {
    changePerPage: (value: number) => void;
}

interface FilterOverrides {
    perPage?: number;
}

const RunsPaneFilters = forwardRef<RunsPaneFiltersHandle, Props>(function RunsPaneFilters(
    { perPage, onLoadingChange },
    ref,
) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const [open, setOpen] = useState(false);
    const [metaFilters, setMetaFilters] = useState<MetaFilter[]>([emptyMetaFilter()]);
    const [metaPredicate, setMetaPredicate] = useState<MetaPredicate>('and');
    const [metaPresence, setMetaPresence] = useState<MetaPresence>('');
    const [dateFrom, setDateFrom] = useState('');
    const [dateTo, setDateTo] = useState('');
    const [statusFilters, setStatusFilters] = useState<Set<string>>(new Set());
    const metaConditionsDisabled = metaPresence === 'none';
    const metadataFilteringEnabled = settings.run_metadata_search_enabled;
    const metadataFilteringPromoted = !metadataFilteringEnabled && settings.promote_disabled_features;

    const buildFilterParams = (overrides?: FilterOverrides) => {
        const validFilters = !metadataFilteringEnabled || metaPresence === 'none'
            ? []
            : metaFilters.filter(filter => filter.key.trim() !== '');

        return {
            meta_filters: validFilters.length > 0 ? validFilters : undefined,
            meta_predicate: validFilters.length > 1 ? metaPredicate : undefined,
            meta_presence: metadataFilteringEnabled ? metaPresence || undefined : undefined,
            date_from: dateFrom || undefined,
            date_to: dateTo || undefined,
            statuses: statusFilters.size > 0 ? [...statusFilters] : undefined,
            per_page: overrides?.perPage ?? perPage,
        };
    };

    const submitFilters = (overrides?: FilterOverrides) => {
        onLoadingChange(true);
        router.get(window.location.pathname + window.location.hash, buildFilterParams(overrides), {
            preserveState: true,
            preserveScroll: true,
            queryStringArrayFormat: 'indices',
            onFinish: () => onLoadingChange(false),
        });
    };

    useImperativeHandle(ref, () => ({
        changePerPage: value => submitFilters({ perPage: value }),
    }));

    const removeMetaFilter = (index: number) => {
        const next = metaFilters.length <= 1
            ? [emptyMetaFilter()]
            : metaFilters.filter((_, filterIndex) => filterIndex !== index);
        setMetaFilters(next);
    };

    const toggleStatusFilter = (status: string) => {
        setStatusFilters(previous => {
            const next = new Set(previous);
            if (next.has(status)) next.delete(status);
            else next.add(status);
            return next;
        });
    };

    const setMetaPresenceFilter = (presence: MetaPresence) => {
        setMetaPresence(presence);
    };

    const clearFilters = () => {
        setMetaFilters([emptyMetaFilter()]);
        setMetaPredicate('and');
        setDateFrom('');
        setDateTo('');
        setStatusFilters(new Set());
        setMetaPresence('');
        onLoadingChange(true);
        router.get(window.location.pathname + window.location.hash, { per_page: perPage }, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => onLoadingChange(false),
        });
    };

    const activeFilterCount = (metadataFilteringEnabled && !metaConditionsDisabled ? metaFilters.filter(filter => filter.key.trim()).length : 0)
        + (metadataFilteringEnabled && metaPresence !== '' ? 1 : 0)
        + (dateFrom !== '' ? 1 : 0)
        + (dateTo !== '' ? 1 : 0)
        + statusFilters.size;

    return (
        <S.Section>
            <S.Header>
                <S.ToggleWrapper>
                    <S.Toggle onClick={() => setOpen(previous => !previous)}>
                        <Icon icon={open ? 'lucide:chevron-down' : 'lucide:chevron-right'} width={12} height={12} />
                        <Icon icon="lucide:filter" width={12} height={12} />
                        Filters
                    </S.Toggle>
                </S.ToggleWrapper>
            </S.Header>
            {open && (
                <S.Body>
                    <DateFilters
                        dateFrom={dateFrom}
                        dateTo={dateTo}
                        onDateFromChange={setDateFrom}
                        onDateToChange={setDateTo}
                    />
                    <S.Separator />
                    <StatusFilters selectedStatuses={statusFilters} onToggle={toggleStatusFilter} />
                    {(metadataFilteringEnabled || metadataFilteringPromoted) && (
                        <>
                            <S.Separator />
                            <PresenceFilters
                                disabled={!metadataFilteringEnabled}
                                value={metaPresence}
                                onChange={setMetaPresenceFilter}
                            />
                            <S.Separator />
                            <MetaFilters
                                disabled={!metadataFilteringEnabled || metaConditionsDisabled}
                                disabledMessage={metadataFilteringPromoted
                                    ? promotionReason(settings.disabled_feature_message)
                                    : undefined}
                                filters={metaFilters}
                                predicate={metaPredicate}
                                onApply={() => submitFilters()}
                                onChange={setMetaFilters}
                                onPredicateChange={setMetaPredicate}
                                onRemove={removeMetaFilter}
                            />
                        </>
                    )}
                    <S.FilterFooter>
                        <Button
                            size="sm"
                            variant="secondary"
                            type="button"
                            disabled={activeFilterCount === 0}
                            onClick={clearFilters}
                        >
                            Reset
                        </Button>
                        <Button size="sm" type="button" onClick={() => submitFilters()}>
                            Apply
                        </Button>
                    </S.FilterFooter>
                </S.Body>
            )}
        </S.Section>
    );
});

export default RunsPaneFilters;
