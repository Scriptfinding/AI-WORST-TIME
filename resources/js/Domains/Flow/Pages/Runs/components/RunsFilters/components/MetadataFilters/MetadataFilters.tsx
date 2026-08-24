import React from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import MessageContent from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/MessageContent/MessageContent';
import { META_OPERATORS } from '@/Domains/Flow/Pages/Runs/config';
import type { MetaFilter, MetaPresence } from '@/Domains/Flow/Pages/Runs/types';
import * as S from './styled';

interface Props {
    disabled?: boolean;
    disabledMessage?: string;
    filters: MetaFilter[];
    predicate: 'and' | 'or';
    presence: MetaPresence;
    onAdd: () => void;
    onPresenceChange: (value: MetaPresence) => void;
    onPredicateChange: (value: 'and' | 'or') => void;
    onRemove: (index: number) => void;
    onUpdate: (index: number, field: keyof MetaFilter, value: string) => void;
}

const MetadataFilters = ({
    disabled = false,
    disabledMessage,
    filters,
    predicate,
    presence,
    onAdd,
    onPresenceChange,
    onPredicateChange,
    onRemove,
    onUpdate,
}: Props) => {
    const conditionsDisabled = disabled || presence === 'none';

    return (
        <S.MetaSection>
            <S.MetaHeader>
                <S.MetaTitle><Icon icon="lucide:tags" width={13} height={13} />Meta filters</S.MetaTitle>
                {filters.length > 1 && (
                    <S.PredicateGroup>
                        <S.PredicateButton type="button" $active={predicate === 'and'} disabled={conditionsDisabled} onClick={() => onPredicateChange('and')}>AND</S.PredicateButton>
                        <S.PredicateButton type="button" $active={predicate === 'or'} disabled={conditionsDisabled} onClick={() => onPredicateChange('or')}>OR</S.PredicateButton>
                    </S.PredicateGroup>
                )}
            </S.MetaHeader>
            <S.MetaPresenceGroup aria-label="Meta presence filter">
                <S.MetaPresenceButton type="button" $active={presence === 'none'} $tone="none" disabled={disabled} onClick={() => onPresenceChange('none')} title="Sans meta" aria-label="Sans meta">
                    <Icon icon="lucide:x" width={13} height={13} />
                </S.MetaPresenceButton>
                <S.MetaPresenceButton type="button" $active={presence === ''} $tone="neutral" disabled={disabled} onClick={() => onPresenceChange('')} title="Peu importe" aria-label="Peu importe">
                    <Icon icon="lucide:minus" width={13} height={13} />
                </S.MetaPresenceButton>
                <S.MetaPresenceButton type="button" $active={presence === 'any'} $tone="any" disabled={disabled} onClick={() => onPresenceChange('any')} title="Avec meta" aria-label="Avec meta">
                    <Icon icon="lucide:check" width={13} height={13} />
                </S.MetaPresenceButton>
            </S.MetaPresenceGroup>
            <S.MetaRows>
                {filters.map((filter, index) => (
                    <S.MetaRow key={index}>
                        <S.Input disabled={conditionsDisabled} value={filter.key} onChange={event => onUpdate(index, 'key', event.target.value)} placeholder="key" />
                        <S.Select disabled={conditionsDisabled} value={filter.operator} onChange={event => onUpdate(index, 'operator', event.target.value)}>
                            {META_OPERATORS.map(operator => <option key={operator} value={operator}>{operator.replace('_', ' ')}</option>)}
                        </S.Select>
                        {filter.operator !== 'exists'
                            ? <S.Input disabled={conditionsDisabled} value={filter.value} onChange={event => onUpdate(index, 'value', event.target.value)} placeholder="value" />
                            : <S.Input value="" disabled placeholder="exists" />}
                        <S.MetaRemoveButton type="button" title="Remove filter" disabled={conditionsDisabled} onClick={() => onRemove(index)}>
                            <Icon icon="lucide:x" width={14} height={14} />
                            <S.MetaRemoveButtonLabel>Supprimer</S.MetaRemoveButtonLabel>
                        </S.MetaRemoveButton>
                    </S.MetaRow>
                ))}
            </S.MetaRows>
            {disabled && disabledMessage && (
                <S.DisabledNotice>
                    <Icon icon="lucide:lock" width={12} height={12} />
                    <MessageContent message={disabledMessage} />
                </S.DisabledNotice>
            )}
            <S.MetaFooter>
                <S.AddMetaButton type="button" disabled={conditionsDisabled} onClick={onAdd}>
                    <Icon icon="lucide:plus" width={13} height={13} />Add condition
                </S.AddMetaButton>
            </S.MetaFooter>
        </S.MetaSection>
    );
};

export default MetadataFilters;
