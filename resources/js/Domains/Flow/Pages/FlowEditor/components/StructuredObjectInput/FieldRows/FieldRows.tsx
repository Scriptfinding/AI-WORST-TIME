import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import { useClickOutside } from '@/Shared/Hooks/useClickOutside';
import { isReferenceInputType } from '@/Domains/Flow/Utils/flowInputsMetadata';
import { useAnchoredDropdownPosition } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/hooks/useAnchoredDropdownPosition';
import {
    fieldsFromCollection,
    type FieldCollectionType,
    type FieldValueType,
    type FormField,
} from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/utils';
import FieldRow from './FieldRow/FieldRow';
import NestedFieldsPanel from './NestedFieldsPanel/NestedFieldsPanel';
import { useFieldReordering } from './hooks/useFieldReordering';
import { useVariableSuggestions } from './hooks/useVariableSuggestions';
import {
    convertCollectionValue,
    nestedFieldsAtPath,
    updateNestedFieldsAtPath,
    type NestedLevel,
} from './utils';
import * as S from './styled';

interface FieldRowsProps {
    fields: FormField[];
    readOnly: boolean;
    onChange: (fields: FormField[]) => void;
    collectionType?: FieldCollectionType;
    allowCollections?: boolean;
    lockedTypes?: Record<string, Exclude<FieldValueType, 'variable'>>;
    flowId?: Id;
    onOpenNested?: (field: FormField, index: number) => void;
}

export default function FieldRows({
    fields,
    readOnly,
    onChange,
    collectionType = 'object',
    allowCollections = true,
    lockedTypes,
    flowId,
    onOpenNested,
}: FieldRowsProps) {
    const rowsRef = useRef<HTMLDivElement | null>(null);
    const nestedPanelRef = useRef<HTMLDivElement | null>(null);
    const nestedTriggerRef = useRef<HTMLElement | null>(null);
    const pendingFocusFieldIdRef = useRef<string | null>(null);
    const [nestedPath, setNestedPath] = useState<NestedLevel[]>([]);
    // Keep the displayed fields in state because serializing empty resource and
    // variable values would otherwise turn them back into strings.
    const [nestedFields, setNestedFields] = useState<FormField[]>([]);
    const variableSuggestions = useVariableSuggestions(
        fields.some(field => field.valueType === 'variable'),
    );
    const { dropdownRect: nestedPanelRect } = useAnchoredDropdownPosition(
        nestedTriggerRef,
        nestedPath.length > 0,
        {
            maxHeight: 480,
            gap: 6,
            minHeight: 180,
            minWidth: 640,
            viewportPadding: 12,
            clampLeft: true,
        },
    );

    useEffect(() => {
        const fieldId = pendingFocusFieldIdRef.current;
        if (!fieldId) return;

        const frameId = window.requestAnimationFrame(() => {
            const input = rowsRef.current?.querySelector<HTMLInputElement>(
                `[data-structured-field-input="${fieldId}"]`,
            );
            if (!input) return;

            input.focus({ preventScroll: true });
            rowsRef.current
                ?.querySelector<HTMLButtonElement>('[data-structured-add-entry]')
                ?.scrollIntoView({ block: 'end', behavior: 'smooth' });
            pendingFocusFieldIdRef.current = null;
        });

        return () => window.cancelAnimationFrame(frameId);
    }, [fields]);

    const closeNestedPanel = () => {
        setNestedPath([]);
        setNestedFields([]);
        nestedTriggerRef.current = null;
    };

    useClickOutside({
        refs: [nestedPanelRef],
        onOutside: closeNestedPanel,
        enabled: nestedPath.length > 0,
        eventType: 'pointerdown',
        capture: true,
        ignoreSelectors: [
            '[data-structured-input-variable-panel]',
            '[data-structured-input-nested-panel]',
        ],
    });

    const {
        draggedFieldId,
        dragOverFieldId,
        dragOverPosition,
        handleDragStart,
        handleDragOver,
        handleDrop,
        clearDrag,
    } = useFieldReordering({
        fields,
        onChange,
        onDragStart: closeNestedPanel,
    });

    const updateField = (id: string, nextField: Partial<FormField>) => {
        onChange(fields.map(field => field.id === id ? { ...field, ...nextField } : field));
    };

    const updateFieldType = (field: FormField, valueType: FieldValueType) => {
        const nestedRootIndex = nestedPath[0]?.index;
        if (nestedRootIndex !== undefined && fields[nestedRootIndex]?.id === field.id) {
            closeNestedPanel();
        }
        const leavingVariableMode = field.valueType === 'variable' && valueType !== 'variable';
        const switchingCollectionType = (
            (field.valueType === 'object' || field.valueType === 'array')
            && (valueType === 'object' || valueType === 'array')
        );
        updateField(field.id, {
            valueType,
            value: switchingCollectionType
                ? convertCollectionValue(field.value, field.valueType as FieldCollectionType, valueType as FieldCollectionType)
                : valueType === 'boolean'
                ? 'true'
                : valueType === 'null'
                    ? ''
                    : valueType === 'object'
                        ? '{}'
                        : valueType === 'array'
                            ? '[]'
                            : valueType === 'variable'
                                ? ''
                                : isReferenceInputType(field.valueType) || isReferenceInputType(valueType)
                                    ? ''
                                    : leavingVariableMode
                                        ? valueType === 'number' ? '0' : ''
                                        : field.value,
        });
    };

    const toggleNestedPanel = (field: FormField, index: number, trigger: HTMLElement) => {
        if (onOpenNested) {
            onOpenNested(field, index);
            return;
        }
        if (nestedPath[0]?.index === index) {
            closeNestedPanel();
            return;
        }

        nestedTriggerRef.current = trigger;
        setNestedPath([{
            index,
            label: field.key || (field.valueType === 'array' ? 'Array' : 'Object'),
            type: field.valueType as FieldCollectionType,
        }]);
        setNestedFields(fieldsFromCollection(field.value, field.valueType as FieldCollectionType));
    };

    const addField = () => {
        let key = String(fields.length);
        if (collectionType === 'object') {
            const existingKeys = new Set(fields.map(field => field.key));
            let suffix = 1;
            key = 'key';
            while (existingKeys.has(key)) {
                suffix += 1;
                key = `key${suffix}`;
            }
        }

        const fieldId = `field-${Date.now()}`;
        pendingFocusFieldIdRef.current = fieldId;
        onChange([
            ...fields,
            {
                id: fieldId,
                key,
                value: '',
                valueType: 'string',
            },
        ]);
    };

    const navigateToNestedLevel = (index: number) => {
        if (index === nestedPath.length - 1) return;
        const newPath = nestedPath.slice(0, index + 1);
        const context = nestedFieldsAtPath(fields, newPath);
        if (!context) {
            closeNestedPanel();
            return;
        }
        setNestedPath(newPath);
        setNestedFields(context.fields);
    };

    const showRemoveButton = !readOnly && !lockedTypes;

    return (
        <S.Rows ref={rowsRef}>
            {fields.length === 0 && (
                <S.EmptyState>No entries yet. Add a key/value entry below.</S.EmptyState>
            )}
            {fields.map((field, index) => (
                <FieldRow
                    key={field.id}
                    field={field}
                    index={index}
                    collectionType={collectionType}
                    readOnly={readOnly}
                    lockedType={lockedTypes?.[field.key]}
                    hasLockedTypes={Boolean(lockedTypes)}
                    allowCollections={allowCollections}
                    flowId={flowId}
                    variableSuggestions={variableSuggestions}
                    showRemoveButton={showRemoveButton}
                    nestedOpen={!onOpenNested && nestedPath[0]?.index === index}
                    dragging={draggedFieldId === field.id}
                    dragOver={dragOverFieldId === field.id && draggedFieldId !== field.id}
                    dropPosition={dragOverPosition}
                    onChange={nextField => updateField(field.id, nextField)}
                    onTypeChange={valueType => updateFieldType(field, valueType)}
                    onOpenNested={trigger => toggleNestedPanel(field, index, trigger)}
                    onOpenVariable={closeNestedPanel}
                    onRemove={() => {
                        closeNestedPanel();
                        onChange(fields.filter(item => item.id !== field.id));
                    }}
                    onDragStart={event => handleDragStart(event, field.id)}
                    onDragOver={event => handleDragOver(event, field.id)}
                    onDrop={event => handleDrop(event, field.id)}
                    onDragEnd={clearDrag}
                />
            ))}
            {nestedPath.length > 0 && nestedPanelRect && !readOnly && createPortal(
                <NestedFieldsPanel
                    ref={nestedPanelRef}
                    path={nestedPath}
                    rect={nestedPanelRect}
                    onNavigate={navigateToNestedLevel}
                    onClose={closeNestedPanel}
                >
                    <FieldRows
                        fields={nestedFields}
                        readOnly={readOnly}
                        collectionType={nestedPath[nestedPath.length - 1]?.type}
                        allowCollections
                        flowId={flowId}
                        onOpenNested={(field, index) => {
                            const parentType = nestedPath[nestedPath.length - 1]?.type;
                            setNestedPath(path => [
                                ...path,
                                {
                                    index,
                                    label: parentType === 'array'
                                        ? `Item ${index + 1}`
                                        : field.key || (field.valueType === 'array' ? 'Array' : 'Object'),
                                    type: field.valueType as FieldCollectionType,
                                },
                            ]);
                            setNestedFields(fieldsFromCollection(
                                field.value,
                                field.valueType as FieldCollectionType,
                            ));
                        }}
                        onChange={nextFields => {
                            setNestedFields(nextFields);
                            onChange(updateNestedFieldsAtPath(fields, nestedPath, nextFields));
                        }}
                    />
                </NestedFieldsPanel>,
                document.body,
            )}
            {!lockedTypes && (
                <S.AddButton
                    type="button"
                    disabled={readOnly}
                    data-structured-add-entry
                    onClick={addField}
                >
                    <Icon icon="lucide:plus" width={12} height={12} />
                    Add entry
                </S.AddButton>
            )}
        </S.Rows>
    );
}
