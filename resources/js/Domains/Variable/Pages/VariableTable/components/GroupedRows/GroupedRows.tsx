import React, { useMemo } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { UserVariable } from '@/Domains/Variable/types';
import { groupHierarchicalItems } from '@/Shared/Utils/groupHierarchicalItems';
import VariableRow from '@/Domains/Variable/Pages/VariableTable/components/VariableRow/VariableRow';
import * as S from './styled';

interface GroupedRowsProps {
    variables: UserVariable[];
    selectedIds: Set<Id>;
    onToggleSelected: (variableId: Id) => void;
    collapsedGroups: Set<string>;
    isGroupHidden: (key: string) => boolean;
    workspaceColor?: string;
    onDelete: (variable: UserVariable) => void;
    onEdit: (variable: UserVariable) => void;
    onInspect: (variable: UserVariable) => void;
    onToggleGroup: (key: string) => void;
}

const COLUMN_COUNT = 7;

export default function GroupedRows({
    variables,
    selectedIds,
    onToggleSelected,
    collapsedGroups,
    isGroupHidden,
    workspaceColor,
    onDelete,
    onEdit,
    onInspect,
    onToggleGroup,
}: GroupedRowsProps) {
    const sections = useMemo(
        () => groupHierarchicalItems(variables, variable => variable.group),
        [variables],
    );

    return sections.map((section, sectionIndex) => {
        const lastHeader = section.headers[section.headers.length - 1];
        const itemIndent = lastHeader ? (lastHeader.depth + 1) * 16 : 0;
        const hideItems = section.group ? isGroupHidden(section.group) : false;
        const visibleHeaders = section.headers.filter(header => {
            const parentKey = header.key.split('/').slice(0, -1).join('/');
            return !parentKey || !isGroupHidden(parentKey);
        });
        if (hideItems && visibleHeaders.length === 0) return null;

        return (
            <React.Fragment key={sectionIndex}>
                {visibleHeaders.map(header => (
                    <S.GroupRow key={header.key}>
                        <td colSpan={COLUMN_COUNT}>
                            <S.GroupHeaderButton
                                type="button"
                                $depth={header.depth}
                                onClick={() => onToggleGroup(header.key)}
                            >
                                <Icon
                                    icon={collapsedGroups.has(header.key)
                                        ? 'lucide:chevron-right'
                                        : 'lucide:chevron-down'}
                                    width={12}
                                />
                                <Icon icon="lucide:folder" width={12} />
                                <span>{header.label}</span>
                                <S.GroupCount>({header.count})</S.GroupCount>
                            </S.GroupHeaderButton>
                        </td>
                    </S.GroupRow>
                ))}
                {!hideItems && section.items.map(variable => (
                    <VariableRow
                        key={variable.id}
                        variable={variable}
                        canEdit={variable.can_manage}
                        selected={selectedIds.has(variable.id)}
                        onToggleSelected={onToggleSelected}
                        indent={itemIndent}
                        workspaceColor={workspaceColor}
                        onDelete={onDelete}
                        onEdit={onEdit}
                        onInspect={onInspect}
                    />
                ))}
            </React.Fragment>
        );
    });
}
