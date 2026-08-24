import React from 'react';
import { ucfirst } from '@/Shared/Utils/string';
import { ALL_STATUSES } from '@/Domains/Flow/Pages/Runs/config';
import type { RunUser } from '@/Domains/Flow/Pages/Runs/types';
import RunUserFilter from '@/Domains/Flow/Pages/Runs/components/RunsFilters/components/RunUserFilter/RunUserFilter';
import * as S from './styled';

interface Props {
    flowSearch: string;
    dateFrom: string;
    dateTo: string;
    durationMin: string;
    durationMax: string;
    selectedRunUserId: Id;
    runUsers: RunUser[];
    statusFilters: Set<string>;
    resetVersion: number;
    onFlowSearchChange: (value: string) => void;
    onDateFromChange: (value: string) => void;
    onDateToChange: (value: string) => void;
    onDurationMinChange: (value: string) => void;
    onDurationMaxChange: (value: string) => void;
    onRunUserChange: (value: string) => void;
    onStatusToggle: (status: string) => void;
}

const MainFilters = ({
    flowSearch,
    dateFrom,
    dateTo,
    durationMin,
    durationMax,
    selectedRunUserId,
    runUsers,
    statusFilters,
    resetVersion,
    onFlowSearchChange,
    onDateFromChange,
    onDateToChange,
    onDurationMinChange,
    onDurationMaxChange,
    onRunUserChange,
    onStatusToggle,
}: Props) => (
    <>
        <S.FilterRow>
            <S.SearchField>
                <S.FieldLabel>Search</S.FieldLabel>
                <S.Input value={flowSearch} onChange={event => onFlowSearchChange(event.target.value)} placeholder="Flow name or ID" />
            </S.SearchField>
            <S.Field>
                <S.FieldLabel>Date from</S.FieldLabel>
                <S.Input type="datetime-local" value={dateFrom} onChange={event => onDateFromChange(event.target.value)} />
            </S.Field>
            <S.Field>
                <S.FieldLabel>Date to</S.FieldLabel>
                <S.Input type="datetime-local" value={dateTo} onChange={event => onDateToChange(event.target.value)} />
            </S.Field>
        </S.FilterRow>
        <S.FilterRow>
            <S.FilterBlock>
                <S.FieldLabel>Status</S.FieldLabel>
                <S.StatusRow>
                    {ALL_STATUSES.map(status => (
                        <S.StatusChip key={status} type="button" $active={statusFilters.has(status)} onClick={() => onStatusToggle(status)}>
                            {ucfirst(status)}
                        </S.StatusChip>
                    ))}
                </S.StatusRow>
            </S.FilterBlock>
            <RunUserFilter
                key={resetVersion}
                runUsers={runUsers}
                selectedRunUserId={selectedRunUserId}
                onChange={onRunUserChange}
            />
            <S.Field>
                <S.FieldLabel>Min duration (s)</S.FieldLabel>
                <S.Input type="number" min="0" step="0.1" value={durationMin} onChange={event => onDurationMinChange(event.target.value)} placeholder="0" />
            </S.Field>
            <S.Field>
                <S.FieldLabel>Max duration (s)</S.FieldLabel>
                <S.Input type="number" min="0" step="0.1" value={durationMax} onChange={event => onDurationMaxChange(event.target.value)} placeholder="60" />
            </S.Field>
        </S.FilterRow>
    </>
);

export default MainFilters;
