import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import InspectorValue from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/components/InspectorValue/InspectorValue';
import {
    resolveReferenceDisplay,
    type ReferenceDisplay,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/referenceDisplays';
import { isContainer, type InspectorTreeRow } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/utils';
import * as S from './styled';

interface InspectorSchemaTreeProps {
    rows: InspectorTreeRow[];
    references: ReadonlyMap<string, ReferenceDisplay>;
}

const TYPE_ICONS: Record<string, string> = {
    array: 'lucide:brackets',
    bigint: 'lucide:binary',
    boolean: 'lucide:toggle-left',
    circular: 'lucide:refresh-cw',
    function: 'lucide:code-2',
    null: 'lucide:circle-slash-2',
    number: 'lucide:hash',
    object: 'lucide:braces',
    string: 'lucide:type',
    symbol: 'lucide:at-sign',
    undefined: 'lucide:circle-help',
};

export default function InspectorSchemaTree({ rows, references }: InspectorSchemaTreeProps) {
    const [collapsedPaths, setCollapsedPaths] = useState<Set<string>>(() => new Set());
    const schemaRows = rows.filter(item => item.depth > 0 || item.path !== '$');
    const visibleRows: Array<{ item: InspectorTreeRow; hasChildren: boolean }> = [];
    let collapsedDepth: number | null = null;

    schemaRows.forEach((item, index) => {
        if (collapsedDepth !== null && item.depth > collapsedDepth) return;
        collapsedDepth = null;

        const hasChildren = schemaRows[index + 1]?.depth > item.depth;
        visibleRows.push({ item, hasChildren });
        if (hasChildren && collapsedPaths.has(item.path)) collapsedDepth = item.depth;
    });

    const toggleCollapsed = (path: string) => {
        setCollapsedPaths(current => {
            const next = new Set(current);
            if (next.has(path)) next.delete(path);
            else next.add(path);
            return next;
        });
    };

    return (
        <S.Tree>
            {visibleRows.map(({ item, hasChildren }) => {
                const referenceDisplay = resolveReferenceDisplay(item.value, references);
                const itemCount = isContainer(item.value)
                    ? Array.isArray(item.value) ? item.value.length : Object.keys(item.value).length
                    : null;
                const summary = itemCount ? `${itemCount} item${itemCount === 1 ? '' : 's'}` : '';
                const collapsed = collapsedPaths.has(item.path);

                return (
                    <S.Row
                        key={item.path}
                        $depth={Math.max(0, item.depth - 1)}
                    >
                        {hasChildren ? (
                            <S.CollapseButton
                                type="button"
                                draggable={false}
                                aria-label={collapsed ? `Expand ${item.key}` : `Collapse ${item.key}`}
                                aria-expanded={!collapsed}
                                onClick={() => toggleCollapsed(item.path)}
                            >
                                <Icon icon={collapsed ? 'lucide:chevron-right' : 'lucide:chevron-down'} width={12} height={12} />
                            </S.CollapseButton>
                        ) : <S.CollapseSpacer />}
                        <S.TypeBadge
                            draggable
                            title="Drag into an expression field"
                            onDragStart={event => {
                                event.dataTransfer.setData('text/plain', item.path);
                                event.dataTransfer.effectAllowed = 'copy';
                            }}
                        >
                            <S.TypeIcon>
                                <Icon
                                    icon={referenceDisplay?.icon ?? TYPE_ICONS[item.type] ?? 'lucide:variable'}
                                    width={13}
                                    height={13}
                                    style={referenceDisplay?.iconColor ? { color: referenceDisplay.iconColor } : undefined}
                                />
                            </S.TypeIcon>
                            <S.Name>{item.key}</S.Name>
                        </S.TypeBadge>
                        {isContainer(item.value)
                            ? summary && <S.Summary>{summary}</S.Summary>
                            : (
                                <S.Value>
                                    <InspectorValue
                                        value={referenceDisplay?.label ?? item.value}
                                        quoteStrings={false}
                                        resourceEditUrl={referenceDisplay?.editUrl}
                                    />
                                </S.Value>
                            )}
                    </S.Row>
                );
            })}
        </S.Tree>
    );
}
