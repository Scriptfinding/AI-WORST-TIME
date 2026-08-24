import type React from 'react';
import { useMemo, useRef } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { CanvasNode, NodePortKind } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    formatEntryLabel,
    getEntryByName,
    getNodeCategoryColor,
    getNodeIcon,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import { getNodeInputPorts, getNodeOutputPorts } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/constants';
import { getNodeSiteUrl, getSiteFaviconUrl } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/site';
import {
    getMissingRequiredParameters,
    getUnavailableBrowserTabIssue,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import { canDeactivateNode, EMPTY_OUTPUT_PORT_SET } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/node';
import { useNodeValidationResources } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/NodeValidationContext';
import * as S from './styled';
import * as SharedS from '../shared.styled';

interface CanvasNodeCardProps {
    node: CanvasNode;
    availableTabNames?: readonly string[];
    connectedOutputPorts?: ReadonlySet<string>;
    selected: boolean;
    selectionPreview?: boolean;
    runActive?: boolean;
    runPassed?: boolean;
    runError?: boolean;
    readOnly?: boolean;
    openMenu: boolean;
    onPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode) => void;
    onDoubleClick: (node: CanvasNode) => void;
    onPortPointerDown: (event: React.PointerEvent<HTMLDivElement>, node: CanvasNode, port: NodePortKind, side: 'input' | 'output') => void;
    onDuplicate: (node: CanvasNode) => void;
    onToggleDeactivation: (node: CanvasNode) => void;
    onDelete: (nodeIds: Iterable<string>) => void;
    onToggleMenu: (nodeId: string) => void;
    onRun?: () => void;
}

export default function CanvasNodeCard({
    node,
    availableTabNames = [],
    connectedOutputPorts = EMPTY_OUTPUT_PORT_SET,
    selected,
    selectionPreview,
    runActive,
    runPassed,
    runError,
    readOnly,
    openMenu,
    onPointerDown,
    onDoubleClick,
    onPortPointerDown,
    onDuplicate,
    onToggleDeactivation,
    onDelete,
    onToggleMenu,
    onRun,
}: CanvasNodeCardProps) {
    const handledPointerDoubleClickRef = useRef(false);
    const validationResources = useNodeValidationResources();
    const entry = node.system || node.entry.category === 'Snippets' || node.localFunctionId
        ? node.entry
        : getEntryByName(node.entry.name);
    const nodeIcon = node.system === 'function' && !node.scopeId
        ? 'lucide:box'
        : node.system === 'function' && node.scopeId
            ? 'lucide:square-function'
        : getNodeIcon(entry);
    const nodeColor = node.system === 'function'
        ? node.scopeId ? '#06b6d4' : '#14b8a6'
        : getNodeCategoryColor(entry);
    const inputPorts = getNodeInputPorts(entry.name);
    const outputPorts = getNodeOutputPorts(entry.name, entry);
    const skipValidation = Boolean(node.deactivated || (node.system && !(node.system === 'function' && node.scopeId)));
    const validationIssues = useMemo(() => {
        if (skipValidation) return [];

        const issues = getMissingRequiredParameters(
            entry,
            node.values,
            connectedOutputPorts,
            validationResources,
        );
        const unavailableTabIssue = getUnavailableBrowserTabIssue(entry, node.values, availableTabNames);
        return unavailableTabIssue ? [...issues, unavailableTabIssue] : issues;
    }, [
        availableTabNames,
        connectedOutputPorts,
        entry,
        node.values,
        skipValidation,
        validationResources,
    ]);
    const invalid = validationIssues.length > 0;
    const siteUrl = invalid ? null : getNodeSiteUrl(node);
    const faviconUrl = siteUrl ? getSiteFaviconUrl(siteUrl) : null;
    const displayLabel = node.system === 'terminate'
        ? 'FINALLY'
        : node.system === 'function' && !node.scopeId
            ? 'SNIPPET'
            : node.label?.trim() || formatEntryLabel(entry);
    const handleCardPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
        if (event.button === 0 && event.detail >= 2) {
            event.preventDefault();
            event.stopPropagation();
            handledPointerDoubleClickRef.current = true;
            onDoubleClick(node);
            return;
        }

        handledPointerDoubleClickRef.current = false;
        onPointerDown(event, node);
    };
    const handleNativeDoubleClick = () => {
        if (handledPointerDoubleClickRef.current) {
            handledPointerDoubleClickRef.current = false;
            return;
        }

        onDoubleClick(node);
    };

    return (
        <S.CanvasNode
            data-node-card
            data-node-id={node.id}
            data-node-system={node.system ?? undefined}
            data-selected={selected}
            data-selection-preview={selectionPreview}
            data-invalid={invalid}
            data-run-active={runActive}
            data-run-passed={runPassed}
            data-run-error={runError}
            data-deactivated={node.deactivated}
            $selected={selected}
            $invalid={invalid}
            onPointerDown={handleCardPointerDown}
            onDoubleClick={handleNativeDoubleClick}
            style={{ left: node.x, top: node.y }}
        >
            {invalid && (
                <S.NodeValidationBadge title={validationIssues.map(issue => issue.message).join('\n')}>
                    <Icon icon="lucide:x" width={12} height={12} />
                </S.NodeValidationBadge>
            )}
            {siteUrl && faviconUrl && (
                <S.NodeSiteBadge
                    href={siteUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    title={new URL(siteUrl).hostname}
                    onPointerDown={event => event.stopPropagation()}
                    onClick={event => event.stopPropagation()}
                >
                    <Icon icon="lucide:globe-2" width={11} height={11} />
                    <img
                        src={faviconUrl}
                        alt=""
                        onError={event => {
                            event.currentTarget.style.display = 'none';
                        }}
                    />
                </S.NodeSiteBadge>
            )}
            {!readOnly && (!node.system || (node.system === 'function' && node.scopeId)) && (
                <S.NodeHoverActions onPointerDown={event => event.stopPropagation()}>
                    <SharedS.NodeHoverButton
                        type="button"
                        title="Delete node"
                        $danger
                        onClick={event => {
                            event.stopPropagation();
                            onDelete([node.id]);
                        }}
                    >
                        <Icon icon="lucide:trash-2" width={12} height={12} />
                    </SharedS.NodeHoverButton>
                    {canDeactivateNode(node) && (
                        <SharedS.NodeHoverButton
                            type="button"
                            title={node.deactivated ? 'Activate node' : 'Deactivate node'}
                            aria-label={node.deactivated ? 'Activate node' : 'Deactivate node'}
                            onClick={event => {
                                event.stopPropagation();
                                onToggleDeactivation(node);
                            }}
                        >
                            <Icon icon={node.deactivated ? 'lucide:power' : 'lucide:power-off'} width={12} height={12} />
                        </SharedS.NodeHoverButton>
                    )}
                    {!node.system && (
                    <SharedS.NodeHoverMenuWrap data-node-hover-menu>
                        <SharedS.NodeHoverButton
                            type="button"
                            title="More actions"
                            onClick={event => {
                                event.stopPropagation();
                                onToggleMenu(node.id);
                            }}
                        >
                            <Icon icon="lucide:ellipsis" width={13} height={13} />
                        </SharedS.NodeHoverButton>
                        {openMenu && (
                            <SharedS.NodeHoverDropdown onClick={event => event.stopPropagation()}>
                                {canDeactivateNode(node) && (
                                    <SharedS.NodeHoverDropdownItem
                                        type="button"
                                        onClick={() => onToggleDeactivation(node)}
                                    >
                                        <span>
                                            <Icon icon={node.deactivated ? 'lucide:power' : 'lucide:power-off'} width={12} height={12} />
                                            {node.deactivated ? 'Activate' : 'Deactivate'}
                                        </span>
                                        <kbd><b>M</b></kbd>
                                    </SharedS.NodeHoverDropdownItem>
                                )}
                                <SharedS.NodeHoverDropdownItem
                                    type="button"
                                    onClick={() => onDuplicate(node)}
                                >
                                    <span>
                                        <Icon icon="lucide:copy" width={12} height={12} />
                                        Duplicate
                                    </span>
                                    <kbd><b>D</b></kbd>
                                </SharedS.NodeHoverDropdownItem>
                                <SharedS.NodeHoverDropdownItem
                                    type="button"
                                    $danger
                                    onClick={() => onDelete([node.id])}
                                >
                                    <span>
                                        <Icon icon="lucide:trash-2" width={12} height={12} />
                                        Delete
                                    </span>
                                    <kbd>Del / <b>X</b></kbd>
                                </SharedS.NodeHoverDropdownItem>
                            </SharedS.NodeHoverDropdown>
                        )}
                    </SharedS.NodeHoverMenuWrap>
                    )}
                </S.NodeHoverActions>
            )}
            <S.NodeTile>
                <S.NodeIcon $color={nodeColor}>
                    <Icon icon={nodeIcon} width={30} height={30} />
                </S.NodeIcon>
            </S.NodeTile>
            <S.NodeLabel>
                <S.NodeLabelText>{displayLabel}</S.NodeLabelText>
                {node.deactivated && <S.NodeDeactivatedLabel>(Deactivated)</S.NodeDeactivatedLabel>}
            </S.NodeLabel>
            {node.system === 'terminate' && (
                <S.NodeHint>
                    Runs cleanup logic even if the flow fails
                </S.NodeHint>
            )}
            {node.system === 'run' && (
                <S.NodeHint>
                    Entry point of the flow run
                </S.NodeHint>
            )}
            {node.system === 'function' && (
                <S.NodeHint>
                    Receives the arguments passed by the caller
                </S.NodeHint>
            )}
            {inputPorts.map((port, index) => (
                <S.NodeHandle
                    key={port.id}
                    data-node-port
                    data-node-id={node.id}
                    data-port-kind={port.id}
                    data-port-side={port.side}
                    $side="input"
                    $index={index}
                    $count={inputPorts.length}
                    onPointerDown={event => onPortPointerDown(event, node, port.id, port.side)}
                />
            ))}
            {node.system === 'run' && onRun && (
                <S.NodeRunAction
                    type="button"
                    onPointerDown={event => event.stopPropagation()}
                    onClick={event => {
                        event.stopPropagation();
                        onRun();
                    }}
                >
                    <Icon icon="lucide:play" width={13} height={13} />
                    Run Flow
                </S.NodeRunAction>
            )}
            {outputPorts.map((port, index) => (
                <S.NodeHandle
                    key={port.id}
                    data-node-port
                    data-node-id={node.id}
                    data-port-kind={port.id}
                    data-port-side={port.side}
                    $side="output"
                    $index={index}
                    $count={outputPorts.length}
                    onPointerDown={event => onPortPointerDown(event, node, port.id, port.side)}
                >
                    {outputPorts.length > 1 && (
                        <S.NodeHandleLabel>{port.label}</S.NodeHandleLabel>
                    )}
                </S.NodeHandle>
            ))}
        </S.CanvasNode>
    );
}
