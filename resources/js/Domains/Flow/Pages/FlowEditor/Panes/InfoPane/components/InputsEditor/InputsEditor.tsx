import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router } from '@inertiajs/react';
import type { FormDataConvertible } from '@inertiajs/core';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { useConfirm } from '@/Shared/Hooks/useConfirm';
import { useBeforeUnloadProtection } from '@/Shared/Hooks/useBeforeUnloadProtection';
import { SectionTitle } from '@/Domains/Flow/Pages/FlowEditor/shared/paneLayout.styled';
import { RunInputError } from '@/Domains/Flow/Pages/FlowEditor/shared/runStatus.styled';
import type { Flow } from '@/Domains/Flow/types';
import StructuredObjectInput from '@/Domains/Flow/Pages/FlowEditor/components/StructuredObjectInput/StructuredObjectInput';
import * as S from './styled';

interface InputsEditorProps {
    flow: Flow;
    canEdit: boolean;
    saveRef?: React.MutableRefObject<(() => void) | null>;
}

function serializeInputs(inputs: Flow['default_inputs']) {
    return inputs && Object.keys(inputs).length > 0
        ? JSON.stringify(inputs, null, 2)
        : '{}';
}

export default function InputsEditor({ flow, canEdit, saveRef }: InputsEditorProps) {
    const { confirm, ConfirmModal } = useConfirm();
    const initialValue = serializeInputs(flow.default_inputs);
    const [defaultInputs, setDefaultInputs] = useState(initialValue);
    const [defaultInputsError, setDefaultInputsError] = useState('');
    const [saving, setSaving] = useState(false);
    const savedRef = useRef(initialValue);

    useEffect(() => {
        const value = serializeInputs(flow.default_inputs);
        if (value !== savedRef.current) {
            setDefaultInputs(value);
            savedRef.current = value;
        }
    }, [flow.default_inputs]);

    const handleDefaultInputsChange = useCallback((value: string | undefined) => {
        setDefaultInputs(value || '{}');
    }, []);

    const handleSaveDefaultInputs = useCallback(() => {
        if (!canEdit) return;

        let parsed: Record<string, unknown> | null = null;

        try {
            parsed = JSON.parse(defaultInputs);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                setDefaultInputsError('Must be a JSON object');
                return;
            }
            setDefaultInputsError('');
        } catch {
            setDefaultInputsError('Invalid JSON');
            return;
        }

        const isEmpty = Object.keys(parsed).length === 0;
        const savedValue = isEmpty ? '{}' : JSON.stringify(parsed, null, 2);
        setSaving(true);
        router.put(`/flows/${flow.id}`, {
            default_inputs: (isEmpty ? null : parsed) as FormDataConvertible,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                savedRef.current = savedValue;
                setDefaultInputs(savedValue);
                setDefaultInputsError('');
            },
            onError: () => setDefaultInputsError('Unable to save flow inputs'),
            onFinish: () => setSaving(false),
        });
    }, [canEdit, defaultInputs, flow.id]);

    useEffect(() => {
        if (saveRef) saveRef.current = canEdit ? handleSaveDefaultInputs : null;
        return () => {
            if (saveRef) saveRef.current = null;
        };
    }, [canEdit, handleSaveDefaultInputs, saveRef]);

    const isDirty = defaultInputs !== savedRef.current;
    const blueprintDefinitions = useMemo(
        () => flow.blueprint_input_definitions ?? [],
        [flow.blueprint_input_definitions],
    );
    const hasLockedBlueprintSchema = flow.library_locked && blueprintDefinitions.length > 0;

    const handleRestoreBlueprintDefaults = useCallback(async () => {
        if (!canEdit || blueprintDefinitions.length === 0) return;
        if (!await confirm({
            title: 'Restore blueprint defaults',
            message: 'Replace all current Flow Input values with the defaults defined by the blueprint?',
            confirmLabel: 'Restore defaults',
            variant: 'primary',
        })) {
            return;
        }

        const restored = Object.fromEntries(
            blueprintDefinitions.map(definition => [definition.name, definition.default]),
        );
        const restoredValue = serializeInputs(restored);
        setSaving(true);
        router.put(`/flows/${flow.id}`, {
            default_inputs: restored as FormDataConvertible,
        }, {
            preserveState: true,
            preserveScroll: true,
            onSuccess: () => {
                savedRef.current = restoredValue;
                setDefaultInputs(restoredValue);
                setDefaultInputsError('');
            },
            onError: () => setDefaultInputsError('Unable to restore blueprint defaults'),
            onFinish: () => setSaving(false),
        });
    }, [blueprintDefinitions, canEdit, confirm, flow.id]);

    useBeforeUnloadProtection({ active: isDirty });

    return (
        <>
            <SectionTitle>Flow Inputs</SectionTitle>
            <S.InputsHint>
                Data merged into every run (manual, webhook, cron). Shared across all users.
            </S.InputsHint>
            <div data-default-inputs-editor>
                <StructuredObjectInput
                    value={defaultInputs}
                    onChange={handleDefaultInputsChange}
                    label="Input data"
                    jsonHint={<>Type {'${vars.'}, {'${channels.'}, {'${mailboxWatchers.'}, {'${aiModels.'} or {'${dataTables.'} to insert a reference (autocompleted).</>}
                    expandableTitle="Flow Inputs"
                    modeStorageKey="flow-inputs"
                    readOnly={!canEdit}
                    flowId={flow.id}
                    headerAction={canEdit && hasLockedBlueprintSchema ? (
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleRestoreBlueprintDefaults}
                            disabled={saving}
                        >
                            <Icon icon="lucide:rotate-ccw" width={13} height={13} />
                            Reset
                        </Button>
                    ) : undefined}
                    editorHeight={180}
                />
            </div>
            {defaultInputsError && <RunInputError>{defaultInputsError}</RunInputError>}
            {canEdit && (
                <S.Actions>
                    {isDirty && <S.DirtyHint>Unsaved changes</S.DirtyHint>}
                    <Button size="sm" onClick={handleSaveDefaultInputs} loading={saving} disabled={!isDirty}>
                        <Icon icon="lucide:save" width={13} height={13} />
                        Save
                    </Button>
                </S.Actions>
            )}
            <ConfirmModal />
        </>
    );
}
