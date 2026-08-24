import { useEffect, useMemo, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { HelpEntryDef } from '@/Domains/Flow/Pages/FlowEditor/types';
import type { CanvasNode, NodeParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import type { NodalAutocompleteContext } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/staticAnalysis';
import {
    CODE_NODE_NAME,
    CODE_NODE_VALUE_KEY,
    IF_ELSE_NODE_NAME,
    LOOP_NODE_NAME,
    NO_OP_NODE_NAME,
    SET_NODE_NAME,
    SET_OUTPUT_NODE_NAME,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { normalizeScalarParameterValue } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/expression';
import { EMPTY_OUTPUT_PORT_SET } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import { getMissingRequiredParameters } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import { useNodeValidationResources } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/NodeValidationContext';
import { useQuickRequirementCreation } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/QuickRequirementCreationContext';
import CodeNodeEditor from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/NodeConfigModal/components/CodeNodeEditor/CodeNodeEditor';
import NodeParameterField from './NodeParameterField/NodeParameterField';
import RunOutputField from './RunOutputField/RunOutputField';
import * as S from './styled';

const canNameNodeOutput = (entryName: string) => {
    return ![
        CODE_NODE_NAME,
        IF_ELSE_NODE_NAME,
        LOOP_NODE_NAME,
        NO_OP_NODE_NAME,
        SET_NODE_NAME,
        SET_OUTPUT_NODE_NAME,
        'FUNCTION',
    ].includes(entryName);
};

interface NodeParametersProps {
    node: CanvasNode;
    entry: HelpEntryDef;
    args: string[];
    defaultNodeLabel: string;
    outputVariableValue: string;
    expressionOutputData: unknown;
    autocompleteContext: NodalAutocompleteContext;
    connectedOutputPorts?: ReadonlySet<string>;
    currentSiteUrl?: string | null;
    flowId?: Id;
    readOnly?: boolean;
    onUpdateValue: (nodeId: string, key: string, value: NodeParameterValue) => void;
}

export default function NodeParameters({
    node,
    entry,
    args,
    defaultNodeLabel,
    outputVariableValue,
    expressionOutputData,
    autocompleteContext,
    connectedOutputPorts = EMPTY_OUTPUT_PORT_SET,
    currentSiteUrl,
    flowId,
    readOnly,
    onUpdateValue,
}: NodeParametersProps) {
    const formRef = useRef<HTMLDivElement | null>(null);
    const validationResources = useNodeValidationResources();
    const quickRequirementCreation = useQuickRequirementCreation();
    const canNameOutput = canNameNodeOutput(entry.name);
    const missingRequiredIssues = useMemo(
        () => getMissingRequiredParameters(entry, node.values, connectedOutputPorts, validationResources),
        [connectedOutputPorts, entry, node.values, validationResources],
    );
    const missingRequiredByPath = new Map(
        missingRequiredIssues.map(issue => [issue.path, issue]),
    );
    const requirementBanner = (() => {
        if (
            (entry.name === '$aiControl' || entry.name === '$aiMessage')
            && validationResources.aiSetup?.status === 'loaded'
        ) {
            if (!validationResources.aiSetup.hasAiIntegration) {
                return {
                    title: 'AI integration required',
                    description: 'This node needs an AI integration before a model can be selected.',
                    kind: 'ai-integration' as const,
                    linkLabel: 'Add AI integration',
                };
            }
        }

        if (
            entry.name === '$notify'
            && validationResources.messengerSetup?.status === 'loaded'
        ) {
            if (!validationResources.messengerSetup.hasMessengerIntegration) {
                return {
                    title: 'Messenger integration required',
                    description: 'Notify needs a messenger integration to send messages.',
                    kind: 'messenger-integration' as const,
                    linkLabel: 'Add Messenger Integration',
                };
            }
        }

        if (
            entry.name === '$waitForEmail'
            && validationResources.mailboxSetup?.status === 'loaded'
        ) {
            if (!validationResources.mailboxSetup.hasMailboxIntegration) {
                return {
                    title: 'Mailbox integration required',
                    description: 'Wait for Email needs a mailbox integration to receive messages.',
                    kind: 'mailbox-integration' as const,
                    linkLabel: 'Add mailbox integration',
                };
            }
            if (!validationResources.mailboxSetup.hasMailbox) {
                return {
                    title: 'Mailbox integration required',
                    description: 'Wait for Email needs an active mailbox before a watcher can be selected.',
                    kind: 'mailbox' as const,
                    linkLabel: 'Add mailbox integration',
                };
            }
        }

        return null;
    })();

    const handleRequirementCreation = async () => {
        if (!requirementBanner) return;

        if (requirementBanner.kind === 'ai-integration') {
            await quickRequirementCreation.create('integration', { category: 'ai' });
            return;
        }

        if (requirementBanner.kind === 'messenger-integration') {
            await quickRequirementCreation.create('integration', { category: 'messenger' });
            return;
        }

        if (requirementBanner.kind === 'mailbox') {
            await quickRequirementCreation.create('mailbox');
            return;
        }

        await quickRequirementCreation.create('integration', {
            category: 'other',
            provider: 'mailbox',
        });
    };

    useEffect(() => {
        if (readOnly) return;

        const frame = requestAnimationFrame(() => {
            const firstInput = formRef.current?.querySelector<HTMLElement>(
                'input:not([type="hidden"]):not([disabled]):not([readonly]), textarea:not([disabled]):not([readonly]), select:not([disabled]), [contenteditable="true"], [role="textbox"]:not([aria-disabled="true"]), [role="combobox"]:not([aria-disabled="true"])',
            );
            firstInput?.focus();
        });

        return () => cancelAnimationFrame(frame);
    }, [node.id, readOnly]);

    return (
        <S.Form ref={formRef}>
            <S.Section>
                <S.SectionTitle>
                    <strong>Node parameters</strong>
                    <span>{entry.nodalDesc ?? entry.desc}</span>
                </S.SectionTitle>
                {requirementBanner && (
                    <S.RequirementBanner>
                        <Icon icon="lucide:triangle-alert" width={16} height={16} />
                        <div>
                            <strong>{requirementBanner.title}</strong>
                            <span>
                                {requirementBanner.description}{' '}
                                <button
                                    type="button"
                                    disabled={readOnly}
                                    onClick={handleRequirementCreation}
                                >
                                    {requirementBanner.linkLabel}
                                </button>
                                .
                            </span>
                        </div>
                    </S.RequirementBanner>
                )}
            </S.Section>
            {node.system === 'function' && node.scopeId ? (
                <S.Fields>
                    <S.SchemaField>
                        <strong>Function name</strong>
                        <span>Unique name used to call this private function.</span>
                        <input
                            value={normalizeScalarParameterValue(node.values.name).value}
                            placeholder="myFunction"
                            disabled={readOnly}
                            onChange={event => onUpdateValue(node.id, 'name', { mode: 'fixed', value: event.target.value })}
                        />
                    </S.SchemaField>
                    <NodeParameterField
                        arg="arguments"
                        node={node}
                        entry={entry}
                        expressionOutputData={expressionOutputData}
                        autocompleteContext={autocompleteContext}
                        missingRequiredIssue={missingRequiredByPath.get('arguments')}
                        currentSiteUrl={currentSiteUrl}
                        flowId={flowId}
                        readOnly={readOnly}
                        onUpdateValue={onUpdateValue}
                    />
                </S.Fields>
            ) : entry.name === CODE_NODE_NAME ? (
                <CodeNodeEditor
                    value={normalizeScalarParameterValue(node.values[CODE_NODE_VALUE_KEY]).value}
                    outputData={expressionOutputData}
                    autocompleteContext={autocompleteContext}
                    readOnly={readOnly}
                    onChange={value => onUpdateValue(node.id, CODE_NODE_VALUE_KEY, { mode: 'fixed', value })}
                />
            ) : args.length > 0 ? (
                <S.Fields>
                    {canNameOutput && (
                        <RunOutputField
                            node={node}
                            defaultNodeLabel={defaultNodeLabel}
                            outputVariableValue={outputVariableValue}
                            readOnly={readOnly}
                            onUpdateValue={onUpdateValue}
                        />
                    )}
                    {args.map(arg => {
                        const cleanArg = arg.replace(/\?$/, '').replace(/^\.\.\./, '');
                        const integrationMissing = (
                            entry.name === '$waitForEmail'
                            && cleanArg === 'mailboxWatcherId'
                            && validationResources.mailboxSetup?.status === 'loaded'
                            && !validationResources.mailboxSetup.hasMailbox
                        ) || (
                            (entry.name === '$aiControl' || entry.name === '$aiMessage')
                            && cleanArg === 'aiModelId'
                            && validationResources.aiSetup?.status === 'loaded'
                            && !validationResources.aiSetup.hasAiIntegration
                        ) || (
                            entry.name === '$notify'
                            && cleanArg === 'channelId'
                            && validationResources.messengerSetup?.status === 'loaded'
                            && !validationResources.messengerSetup.hasMessengerIntegration
                        );
                        return (
                            <NodeParameterField
                                key={arg}
                                arg={arg}
                                node={node}
                                entry={entry}
                                expressionOutputData={expressionOutputData}
                                autocompleteContext={autocompleteContext}
                                missingRequiredIssue={missingRequiredByPath.get(cleanArg)}
                                nestedRequiredIssues={missingRequiredIssues.filter(issue => issue.path.startsWith(`${cleanArg}.`))}
                                currentSiteUrl={currentSiteUrl}
                                flowId={flowId}
                                readOnly={readOnly || integrationMissing}
                                onUpdateValue={onUpdateValue}
                            />
                        );
                    })}
                </S.Fields>
            ) : canNameOutput ? (
                <S.Fields>
                    <RunOutputField
                        node={node}
                        defaultNodeLabel={defaultNodeLabel}
                        outputVariableValue={outputVariableValue}
                        readOnly={readOnly}
                        onUpdateValue={onUpdateValue}
                    />
                </S.Fields>
            ) : (
                <S.Empty>No configurable parameters.</S.Empty>
            )}
        </S.Form>
    );
}
