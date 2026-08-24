import { Icon } from '@/Shared/UI/Icon/Icon';
import DraggableKey from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/components/DraggableKey/DraggableKey';
import InspectorValue from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/components/InspectorValue/InspectorValue';
import {
    resolveReferenceDisplay,
    type ReferenceDisplay,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/referenceDisplays';
import {
    containerSummary,
    getContainerEntries,
    hiddenEntryCount,
    isContainer,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/utils';
import * as S from './styled';

interface InspectorTreeNodeProps {
    value: unknown;
    path: string;
    collapsedPaths: Set<string>;
    references: ReadonlyMap<string, ReferenceDisplay>;
    onToggleCollapse: (path: string) => void;
    depth?: number;
    label?: string;
    ancestors?: Set<object>;
}

export default function InspectorTreeNode({
    value,
    path,
    collapsedPaths,
    references,
    onToggleCollapse,
    depth = 0,
    label,
    ancestors = new Set(),
}: InspectorTreeNodeProps) {
    const circular = isContainer(value) && ancestors.has(value);
    const referenceDisplay = resolveReferenceDisplay(value, references);

    if (!isContainer(value) || circular) {
        return (
            <S.JsonLine $depth={depth}>
                <S.TogglePlaceholder />
                {label && <DraggableKey label={label} path={path} />}
                {label && <span>:{'\u00A0'}</span>}
                {circular
                    ? <S.Summary>[Circular]</S.Summary>
                    : (
                        <InspectorValue
                            value={value}
                            referenceId={referenceDisplay?.referenceId}
                            referenceLabel={referenceDisplay?.referenceLabel}
                            resourceEditUrl={referenceDisplay?.editUrl}
                            syntaxHighlight
                        />
                    )}
            </S.JsonLine>
        );
    }

    const collapsed = collapsedPaths.has(path);
    const open = Array.isArray(value) ? '[' : '{';
    const close = Array.isArray(value) ? ']' : '}';
    const entries = getContainerEntries(value, path);
    const hiddenCount = hiddenEntryCount(value);
    const nextAncestors = new Set(ancestors).add(value);

    return (
        <>
            <S.JsonLine $depth={depth}>
                <S.Toggle type="button" title={collapsed ? 'Expand' : 'Collapse'} onClick={() => onToggleCollapse(path)}>
                    <Icon icon={collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={11} height={11} />
                </S.Toggle>
                {label && <DraggableKey label={label} path={path} />}
                {label && <span>:{'\u00A0'}</span>}
                <S.Punctuation>{open}</S.Punctuation>
                {collapsed && (
                    <>
                        <S.Summary> {containerSummary(value)} </S.Summary>
                        <S.Punctuation>{close}</S.Punctuation>
                    </>
                )}
            </S.JsonLine>
            {!collapsed && (
                <>
                    {entries.map(entry => (
                        <InspectorTreeNode
                            key={entry.path}
                            value={entry.value}
                            path={entry.path}
                            references={references}
                            collapsedPaths={collapsedPaths}
                            onToggleCollapse={onToggleCollapse}
                            depth={depth + 1}
                            label={entry.key}
                            ancestors={nextAncestors}
                        />
                    ))}
                    {hiddenCount > 0 && <S.TruncatedLine $depth={depth + 1}>… {hiddenCount} more</S.TruncatedLine>}
                    <S.JsonLine $depth={depth}>
                        <S.TogglePlaceholder />
                        <S.Punctuation>{close}</S.Punctuation>
                    </S.JsonLine>
                </>
            )}
        </>
    );
}
