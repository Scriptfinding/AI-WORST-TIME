import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react';
import FieldRows from './FieldRows/FieldRows';
import JsonEditor from './JsonEditor/JsonEditor';
import ModeControls from './ModeControls/ModeControls';
import {
    fieldsFromCollection,
    fieldsFromDefinitions,
    readStoredInputMode,
    stringifyCollectionFields,
    type FormField,
    type FieldCollectionType,
    type InputMode,
    type StructuredFieldDefinition,
} from './utils';
import * as S from './styled';

interface StructuredObjectInputProps {
    value: string;
    onChange: (value: string | undefined) => void;
    label: string;
    hint?: string;
    jsonHint?: ReactNode;
    expandableTitle: string;
    modeStorageKey?: string;
    readOnly?: boolean;
    editorHeight?: number;
    fieldDefinitions?: StructuredFieldDefinition[];
    headerAction?: ReactNode;
    collectionType?: FieldCollectionType;
    flowId?: Id;
}

export default function StructuredObjectInput({
    value,
    onChange,
    label,
    hint,
    jsonHint,
    expandableTitle,
    modeStorageKey,
    readOnly = false,
    editorHeight = 180,
    fieldDefinitions,
    headerAction,
    collectionType = 'object',
    flowId,
}: StructuredObjectInputProps) {
    const storageKey = `puppetflow:structured-object-input:mode:${modeStorageKey ?? expandableTitle}`;
    const expandJsonRef = useRef<(() => void) | null>(null);
    const isFormChangeRef = useRef(false);
    const [inputMode, setInputMode] = useState<InputMode>(() => readStoredInputMode(storageKey));
    const fieldsFromValue = useCallback((raw: string) => (
        fieldDefinitions
            ? fieldsFromDefinitions(raw, fieldDefinitions)
            : fieldsFromCollection(raw, collectionType)
    ), [collectionType, fieldDefinitions]);
    const [fields, setFields] = useState<FormField[]>(() => fieldsFromValue(value));

    useEffect(() => {
        if (inputMode !== 'form') return;
        if (isFormChangeRef.current) {
            isFormChangeRef.current = false;
            return;
        }
        setFields(fieldsFromValue(value));
    }, [fieldsFromValue, inputMode, value]);

    useEffect(() => {
        if (fieldDefinitions && inputMode !== 'form') setInputMode('form');
    }, [fieldDefinitions, inputMode]);

    const updateFields = useCallback((nextFields: FormField[]) => {
        isFormChangeRef.current = true;
        setFields(nextFields);
        onChange(stringifyCollectionFields(nextFields, collectionType));
    }, [collectionType, onChange]);

    const updateInputMode = (mode: InputMode) => {
        setInputMode(mode);
        if (typeof window !== 'undefined') window.localStorage.setItem(storageKey, mode);
        if (mode === 'form') setFields(fieldsFromValue(value));
    };

    return (
        <S.ObjectInput>
            <S.ObjectInputHeader>
                <div>
                    <S.ObjectInputLabel>{label}</S.ObjectInputLabel>
                    {hint && <S.ObjectInputHint>{hint}</S.ObjectInputHint>}
                </div>
                <S.ObjectInputHeaderActions>
                    {headerAction}
                    {!fieldDefinitions && (
                        <ModeControls
                            mode={inputMode}
                            readOnly={readOnly}
                            onChange={updateInputMode}
                            onExpand={() => expandJsonRef.current?.()}
                        />
                    )}
                </S.ObjectInputHeaderActions>
            </S.ObjectInputHeader>

            {inputMode === 'json' ? (
                <>
                    <JsonEditor
                        value={value}
                        title={expandableTitle}
                        readOnly={readOnly}
                        height={editorHeight}
                        flowId={flowId}
                        openRef={expandJsonRef}
                        onChange={onChange}
                    />
                    {jsonHint && <S.ObjectInputHint>{jsonHint}</S.ObjectInputHint>}
                </>
            ) : (
                <FieldRows
                    fields={fields}
                    readOnly={readOnly}
                    lockedTypes={fieldDefinitions
                        ? Object.fromEntries(fieldDefinitions.map(definition => [definition.name, definition.type]))
                        : undefined}
                    collectionType={collectionType}
                    flowId={flowId}
                    onChange={updateFields}
                />
            )}
        </S.ObjectInput>
    );
}
