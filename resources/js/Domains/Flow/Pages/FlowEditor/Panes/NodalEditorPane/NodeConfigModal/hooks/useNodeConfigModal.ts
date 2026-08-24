import { useEffect, useMemo, useState } from 'react';
import type { FlowRun } from '@/Domains/Flow/types';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import {
    formatEntryLabel,
    getEntryByName,
    getSignatureArgs,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import {
    getLoopParameterKeysForMode,
    LOOP_NODE_NAME,
    NODE_RUN_OUTPUT_KEY,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import {
    createEffectiveAutocompleteContext,
    createExpressionOutputData,
    createNodeAfterData,
    mergeOutputContextPreview,
    mergeOutputInputPreview,
} from '../utils/preview';
import { asRecord, isInternalNodeOutputKey } from '../utils/values';

interface UseNodeConfigModalOptions {
    node: CanvasNode;
    latestRun: FlowRun | null;
    autocompleteContext: NodalAutocompleteContext;
    isFinallyNode: boolean;
    readOnly?: boolean;
    onClose: () => void;
    onRenameNode: (nodeId: string, label: string) => void;
}

// Builds and validates the editable node configuration used by NodeConfigModal.
export default function useNodeConfigModal({
    node,
    latestRun,
    autocompleteContext,
    isFinallyNode,
    readOnly,
    onClose,
    onRenameNode,
}: UseNodeConfigModalOptions) {
    const catalogEntry = node.system ? node.entry : getEntryByName(node.entry.name);
    const entry = !node.system && catalogEntry.category === 'Custom' ? node.entry : catalogEntry;
    const args = getSignatureArgs(entry.signature);
    const nodalPreviewData = asRecord(latestRun?.internal_meta?.nodal_preview);
    const nodalPreviewInputData = asRecord(nodalPreviewData?.input);
    const nodalPreviewOutputData = asRecord(nodalPreviewData?.output);
    const latestInputData = asRecord(latestRun?.input);
    const latestInputContextData = asRecord(latestInputData?.$context);
    const latestRunOutput = asRecord(latestRun?.output);
    const latestOutputContextData = asRecord(latestRunOutput?.$context);
    const latestOutputInputData = asRecord(latestRunOutput?.$input);
    const rawOutputVariableValue = normalizeScalarParameterValue(node.values[NODE_RUN_OUTPUT_KEY]).value;
    const outputVariableValue = isInternalNodeOutputKey(rawOutputVariableValue, node.id)
        ? ''
        : rawOutputVariableValue;

    const outputContextPreview = useMemo(
        () => mergeOutputContextPreview(
            latestInputContextData,
            autocompleteContext.contextData,
            latestOutputContextData,
        ),
        [autocompleteContext.contextData, latestInputContextData, latestOutputContextData],
    );
    const outputInputPreview = useMemo(
        () => mergeOutputInputPreview(
            latestInputData,
            autocompleteContext.inputData,
            latestOutputInputData,
            nodalPreviewInputData,
        ),
        [autocompleteContext.inputData, latestInputData, latestOutputInputData, nodalPreviewInputData],
    );
    const runPreview = useMemo(
        () => ({ ...(autocompleteContext.runData ?? {}) }),
        [autocompleteContext.runData],
    );
    const expressionOutputData = useMemo(
        () => createExpressionOutputData(
            latestRun,
            asRecord(autocompleteContext.outputData),
            nodalPreviewOutputData,
            isFinallyNode,
        ),
        [autocompleteContext.outputData, isFinallyNode, latestRun, nodalPreviewOutputData],
    );
    const currentNodeAfterData = useMemo(
        () => createNodeAfterData({
            node,
            entry,
            outputVariableValue,
            inputPreview: outputInputPreview,
            outputPreview: expressionOutputData,
            runPreview,
            contextPreview: outputContextPreview,
            nodeData: autocompleteContext.nodeData,
        }),
        [
            autocompleteContext.nodeData,
            entry,
            expressionOutputData,
            node,
            outputContextPreview,
            outputInputPreview,
            outputVariableValue,
            runPreview,
        ],
    );
    const loopMode = entry.name === LOOP_NODE_NAME
        ? normalizeScalarParameterValue(node.values.mode).value || 'items'
        : null;
    const effectiveAutocompleteContext = useMemo(
        () => createEffectiveAutocompleteContext({
            autocompleteContext,
            latestInput: latestInputData,
            latestOutputInput: latestOutputInputData,
            nodalPreviewInput: nodalPreviewInputData,
            runPreview,
            outputContextPreview,
            entryName: entry.name,
            loopMode,
        }),
        [
            autocompleteContext,
            entry.name,
            latestInputData,
            latestOutputInputData,
            loopMode,
            nodalPreviewInputData,
            outputContextPreview,
            runPreview,
        ],
    );
    const visibleInputData = useMemo(() => ({
        $input: effectiveAutocompleteContext.inputData,
        $run: effectiveAutocompleteContext.runData ?? {},
        $output: expressionOutputData ?? {},
        $context: outputContextPreview,
    }), [
        effectiveAutocompleteContext.inputData,
        effectiveAutocompleteContext.runData,
        expressionOutputData,
        outputContextPreview,
    ]);

    const defaultNodeLabel = formatEntryLabel(entry);
    const [labelDraft, setLabelDraft] = useState(node.label?.trim() || defaultNodeLabel);
    const visibleArgs = entry.name === LOOP_NODE_NAME
        ? args.filter(arg => getLoopParameterKeysForMode(loopMode ?? 'items').includes(
            arg.replace(/\?$/, '').replace(/^\.\.\./, ''),
        ))
        : args;

    useEffect(() => {
        setLabelDraft(node.label?.trim() || defaultNodeLabel);
    }, [defaultNodeLabel, node.id, node.label]);

    const commitLabel = () => {
        onRenameNode(node.id, labelDraft);
        setLabelDraft(labelDraft.trim() || defaultNodeLabel);
    };
    const handleClose = () => {
        const currentLabel = node.label?.trim() || defaultNodeLabel;
        if (!readOnly && labelDraft.trim() !== currentLabel) {
            onRenameNode(node.id, labelDraft);
        }
        onClose();
    };

    return {
        entry,
        visibleArgs,
        defaultNodeLabel,
        outputVariableValue,
        expressionOutputData,
        effectiveAutocompleteContext,
        visibleInputData,
        currentNodeAfterData,
        labelDraft,
        setLabelDraft,
        commitLabel,
        handleClose,
    };
}
