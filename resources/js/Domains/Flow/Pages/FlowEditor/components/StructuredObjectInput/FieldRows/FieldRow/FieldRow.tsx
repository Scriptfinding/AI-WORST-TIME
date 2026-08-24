import type { DragEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import CustomSelect from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CustomSelect/CustomSelect';
import { isReferenceInputType } from '@/Domains/Flow/Utils/flowInputsMetadata';
import type {
    FieldCollectionType,
    FieldValueType,
    FormField,
} from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';
import FlowInputResourceSelect from '../FlowInputResourceSelect';
import VariableValueSelect from '../VariableValueSelect/VariableValueSelect';
import type { VariableSuggestionsState } from '../hooks/useVariableSuggestions';
import { fieldTypeOptions, nestedValueIsEmpty, nestedValueSummary } from '../utils';
import * as S from './styled';

interface FieldRowProps {
    field: FormField;
    index: number;
    collectionType: FieldCollectionType;
    readOnly: boolean;
    lockedType?: Exclude<FieldValueType, 'variable'>;
    hasLockedTypes: boolean;
    allowCollections: boolean;
    flowId?: Id;
    variableSuggestions: VariableSuggestionsState;
    showRemoveButton: boolean;
    nestedOpen: boolean;
    dragging: boolean;
    dragOver: boolean;
    dropPosition: 'before' | 'after';
    onChange: (nextField: Partial<FormField>) => void;
    onTypeChange: (valueType: FieldValueType) => void;
    onOpenNested: (trigger: HTMLElement) => void;
    onOpenVariable: () => void;
    onRemove: () => void;
    onDragStart: (event: DragEvent<HTMLButtonElement>) => void;
    onDragOver: (event: DragEvent<HTMLDivElement>) => void;
    onDrop: (event: DragEvent<HTMLDivElement>) => void;
    onDragEnd: () => void;
}

export default function FieldRow({
    field,
    index,
    collectionType,
    readOnly,
    lockedType,
    hasLockedTypes,
    allowCollections,
    flowId,
    variableSuggestions,
    showRemoveButton,
    nestedOpen,
    dragging,
    dragOver,
    dropPosition,
    onChange,
    onTypeChange,
    onOpenNested,
    onOpenVariable,
    onRemove,
    onDragStart,
    onDragOver,
    onDrop,
    onDragEnd,
}: FieldRowProps) {
    return (
        <S.Row
            $array={collectionType === 'array'}
            $hasRemove={showRemoveButton}
            $hasDrag={!readOnly}
            $dragging={dragging}
            $dragOver={dragOver}
            $dropPosition={dropPosition}
            onDragOver={onDragOver}
            onDrop={onDrop}
        >
            {!readOnly && (
                <S.DragHandle
                    type="button"
                    draggable
                    title="Drag to reorder"
                    aria-label={`Reorder ${field.key || `item ${index + 1}`}`}
                    onDragStart={onDragStart}
                    onDragEnd={onDragEnd}
                >
                    <Icon icon="lucide:grip-vertical" width={13} height={13} />
                </S.DragHandle>
            )}
            {collectionType === 'array' ? (
                <S.ArrayIndex>{index + 1}</S.ArrayIndex>
            ) : (
                <S.Input
                    data-structured-field-input={field.id}
                    value={field.key}
                    placeholder="Key"
                    disabled={readOnly || hasLockedTypes}
                    onChange={event => onChange({ key: event.target.value })}
                />
            )}
            <S.TypeSelectValue>
                <CustomSelect
                    value={field.valueType}
                    disabled={readOnly}
                    options={fieldTypeOptions(
                        lockedType,
                        allowCollections,
                        Boolean(flowId),
                    )}
                    searchThreshold={0}
                    showOptionValue={false}
                    onChange={value => onTypeChange(value as FieldValueType)}
                />
            </S.TypeSelectValue>
            {field.valueType === 'null' ? (
                <S.ValuePlaceholder />
            ) : field.valueType === 'boolean' ? (
                <S.BooleanValue>
                    <Switch
                        checked={field.value === 'true'}
                        disabled={readOnly}
                        onChange={checked => onChange({ value: checked ? 'true' : 'false' })}
                    />
                </S.BooleanValue>
            ) : field.valueType === 'object' || field.valueType === 'array' ? (
                <S.NestedValueTrigger
                    type="button"
                    disabled={readOnly}
                    $open={nestedOpen}
                    $empty={nestedValueIsEmpty(field)}
                    aria-expanded={nestedOpen}
                    aria-haspopup="dialog"
                    onClick={event => onOpenNested(event.currentTarget)}
                >
                    <S.ValueIconSlot>
                        <Icon icon={field.valueType === 'array' ? 'lucide:list' : 'lucide:braces'} width={13} height={13} />
                    </S.ValueIconSlot>
                    <span>{nestedValueSummary(field)}</span>
                    <Icon icon="lucide:chevron-down" width={13} height={13} />
                </S.NestedValueTrigger>
            ) : field.valueType === 'variable' ? (
                <VariableValueSelect
                    value={field.value}
                    readOnly={readOnly}
                    variableSuggestions={variableSuggestions}
                    onOpen={onOpenVariable}
                    onChange={value => onChange({ value })}
                />
            ) : isReferenceInputType(field.valueType) && flowId ? (
                <S.ResourceValue>
                    <FlowInputResourceSelect
                        type={field.valueType}
                        value={field.value}
                        flowId={flowId}
                        readOnly={readOnly}
                        onChange={value => onChange({ value })}
                    />
                </S.ResourceValue>
            ) : (
                <S.Input
                    data-structured-field-input={collectionType === 'array' ? field.id : undefined}
                    value={field.value}
                    placeholder="Value"
                    disabled={readOnly}
                    type={field.valueType === 'number' ? 'number' : 'text'}
                    onChange={event => onChange({ value: event.target.value })}
                />
            )}
            {showRemoveButton && (
                <S.RemoveButton type="button" onClick={onRemove} title="Remove entry">
                    <Icon icon="lucide:x" width={14} height={14} />
                    <S.RemoveButtonLabel>Remove</S.RemoveButtonLabel>
                </S.RemoveButton>
            )}
        </S.Row>
    );
}
