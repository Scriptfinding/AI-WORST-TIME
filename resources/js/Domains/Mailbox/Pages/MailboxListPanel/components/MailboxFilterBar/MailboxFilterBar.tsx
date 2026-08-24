import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { TableFilterOption } from '@/Shared/UI/TableFilters/types';
import ScopeSelector from '@/Domains/Mailbox/Pages/MailboxListPanel/components/ScopeSelector/ScopeSelector';
import * as S from './styled';

interface Integration {
    id: string;
    name: string;
}

interface Props {
    hasActiveFilters: boolean;
    integration: string;
    integrations: Integration[];
    scope: string;
    scopeOptions: TableFilterOption[];
    search: string;
    selectedScopeLabel: string;
    sortAscending: boolean;
    onIntegrationChange: (integration: string) => void;
    onReset: () => void;
    onScopeChange: (scope: string) => void;
    onSearchChange: (search: string) => void;
    onSortChange: (ascending: boolean) => void;
}

export default function MailboxFilterBar({
    hasActiveFilters,
    integration,
    integrations,
    scope,
    scopeOptions,
    search,
    selectedScopeLabel,
    sortAscending,
    onIntegrationChange,
    onReset,
    onScopeChange,
    onSearchChange,
    onSortChange,
}: Props) {
    const [resetSignal, setResetSignal] = useState(0);
    const resetFilters = () => {
        onReset();
        setResetSignal(signal => signal + 1);
    };

    return (
        <>
            <S.FilterBar>
                {integrations.length > 1 && (
                    <S.FilterSelect
                        value={integration}
                        onChange={event => onIntegrationChange(event.target.value)}
                    >
                        <option value="">All integrations</option>
                        {integrations.map(item => (
                            <option key={item.id} value={item.id}>{item.name}</option>
                        ))}
                    </S.FilterSelect>
                )}
                <ScopeSelector
                    key={resetSignal}
                    options={scopeOptions}
                    scope={scope}
                    selectedLabel={selectedScopeLabel}
                    onChange={onScopeChange}
                />
                <S.QuickSearch
                    value={search}
                    onChange={event => onSearchChange(event.target.value)}
                    placeholder="Search mailboxes..."
                />
                <S.SortBtn
                    onClick={() => onSortChange(!sortAscending)}
                    title={!sortAscending ? 'A → Z' : 'Z → A'}
                >
                    <Icon
                        icon={!sortAscending ? 'lucide:arrow-down-a-z' : 'lucide:arrow-up-z-a'}
                        width={14}
                    />
                </S.SortBtn>
            </S.FilterBar>
            {hasActiveFilters && (
                <S.FilterResetBanner type="button" onClick={resetFilters}>
                    <Icon icon="lucide:filter-x" width={14} height={14} />
                    Filtered results, click to reset
                </S.FilterResetBanner>
            )}
        </>
    );
}
