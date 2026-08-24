import { Icon } from '@/Shared/UI/Icon/Icon';
import MessageContent from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/MessageContent/MessageContent';
import * as Forms from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import { RUN_META_OPERATORS } from '@/Domains/Flow/Pages/runHistory';
import { emptyMetaFilter, type MetaFilter, type MetaPredicate } from '@/Domains/Flow/Pages/FlowEditor/Panes/RunsPane/components/RunsPaneFilters/types';
import * as S from './styled';

interface Props {
    disabled: boolean;
    disabledMessage?: string;
    filters: MetaFilter[];
    predicate: MetaPredicate;
    onApply: () => void;
    onChange: (filters: MetaFilter[]) => void;
    onPredicateChange: (predicate: MetaPredicate) => void;
    onRemove: (index: number) => void;
}

export default function MetaFilters({
    disabled,
    disabledMessage,
    filters,
    predicate,
    onApply,
    onChange,
    onPredicateChange,
    onRemove,
}: Props) {
    const updateFilter = (index: number, field: keyof MetaFilter, value: string) => {
        onChange(filters.map((filter, filterIndex) => (
            filterIndex === index ? { ...filter, [field]: value } : filter
        )));
    };

    return (
        <>
            <S.Title>Meta filters</S.Title>
            {filters.map((filter, index) => (
                <Forms.MetadataFilterRow key={index}>
                    <Forms.MetadataFilterInput
                        placeholder="key"
                        disabled={disabled}
                        value={filter.key}
                        onChange={event => updateFilter(index, 'key', event.target.value)}
                        onKeyDown={event => event.key === 'Enter' && onApply()}
                    />
                    <Forms.MetadataFilterSelect
                        disabled={disabled}
                        value={filter.operator}
                        onChange={event => updateFilter(index, 'operator', event.target.value)}
                    >
                        {RUN_META_OPERATORS.map(operator => (
                            <option key={operator} value={operator}>{operator.replace('_', ' ')}</option>
                        ))}
                    </Forms.MetadataFilterSelect>
                    {filter.operator !== 'exists' && (
                        <Forms.MetadataFilterInput
                            placeholder="value"
                            disabled={disabled}
                            value={filter.value}
                            onChange={event => updateFilter(index, 'value', event.target.value)}
                            onKeyDown={event => event.key === 'Enter' && onApply()}
                        />
                    )}
                    <Forms.MetadataFilterRemove
                        type="button"
                        disabled={disabled}
                        onClick={() => onRemove(index)}
                        title="Remove filter"
                    >
                        <Icon icon="lucide:x" width={12} height={12} />
                    </Forms.MetadataFilterRemove>
                </Forms.MetadataFilterRow>
            ))}
            {disabled && disabledMessage && (
                <S.DisabledNotice>
                    <Icon icon="lucide:lock" width={11} height={11} />
                    <MessageContent message={disabledMessage} />
                </S.DisabledNotice>
            )}
            <S.Actions>
                <Forms.MetadataFilterAddRow
                    type="button"
                    disabled={disabled}
                    onClick={() => onChange([...filters, emptyMetaFilter()])}
                >
                    <Icon icon="lucide:plus" width={12} height={12} />
                    Add condition
                </Forms.MetadataFilterAddRow>
                {filters.length > 1 && (
                    <S.PredicateGroup>
                        {(['and', 'or'] as const).map(value => (
                            <S.PredicateToggle
                                key={value}
                                type="button"
                                $active={predicate === value}
                                disabled={disabled}
                                onClick={() => onPredicateChange(value)}
                            >
                                {value.toUpperCase()}
                            </S.PredicateToggle>
                        ))}
                    </S.PredicateGroup>
                )}
            </S.Actions>
        </>
    );
}
