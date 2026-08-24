import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AvatarSelectionToggle from '@/Shared/UI/AvatarSelectionToggle/AvatarSelectionToggle';
import TableCellContent from '@/Shared/UI/TableCellContent/TableCellContent';
import type { UserVariable } from '@/Domains/Variable/types';
import ProviderBadge from '@/Domains/Variable/Pages/VariableTable/components/ProviderBadge/ProviderBadge';
import VariableValue from '@/Domains/Variable/Pages/VariableTable/components/VariableValue/VariableValue';
import * as S from './styled';

interface VariableRowProps {
    variable: UserVariable;
    canEdit: boolean;
    selected: boolean;
    onToggleSelected: (variableId: Id) => void;
    indent: number;
    workspaceColor?: string;
    onDelete: (variable: UserVariable) => void;
    onEdit: (variable: UserVariable) => void;
    onInspect: (variable: UserVariable) => void;
}

export default function VariableRow({
    variable,
    canEdit,
    selected,
    onToggleSelected,
    indent,
    workspaceColor,
    onDelete,
    onEdit,
    onInspect,
}: VariableRowProps) {
    const [tooltip, setTooltip] = useState<{
        kind: 'reference' | 'unavailable';
        left: number;
        top: number;
    } | null>(null);
    const tooltipId = `variable-tooltip-${variable.id}`;
    const showTooltip = (kind: 'reference' | 'unavailable', target: HTMLElement) => {
        const rect = target.getBoundingClientRect();
        setTooltip({
            kind,
            left: Math.max(12, Math.min(rect.left, window.innerWidth - 332)),
            top: rect.bottom + 10,
        });
    };

    return (
        <>
            <tr>
                <S.Cell $indent={indent}>
                    <TableCellContent>
                        <S.KeyContainer>
                            {canEdit && (
                                <AvatarSelectionToggle
                                    selected={selected}
                                    onChange={() => onToggleSelected(variable.id)}
                                    label={`${selected ? 'Deselect' : 'Select'} ${variable.key}`}
                                    size={24}
                                >
                                    <S.VariableIcon>
                                        <Icon icon={variable.type === 'secret' ? 'lucide:key-round' : 'lucide:braces'} width={13} />
                                    </S.VariableIcon>
                                </AvatarSelectionToggle>
                            )}
                            <S.VariableKey
                                tabIndex={0}
                                aria-describedby={tooltip?.kind === 'reference' ? tooltipId : undefined}
                                onMouseEnter={event => showTooltip('reference', event.currentTarget)}
                                onMouseLeave={() => setTooltip(null)}
                                onFocus={event => showTooltip('reference', event.currentTarget)}
                                onBlur={() => setTooltip(null)}
                            >
                                {variable.key}
                            </S.VariableKey>
                            {!variable.can_use && (
                                <S.RuntimeRestriction
                                    tabIndex={0}
                                    aria-label="Not available to runs"
                                    aria-describedby={tooltip?.kind === 'unavailable' ? tooltipId : undefined}
                                    onMouseEnter={event => showTooltip('unavailable', event.currentTarget)}
                                    onMouseLeave={() => setTooltip(null)}
                                    onFocus={event => showTooltip('unavailable', event.currentTarget)}
                                    onBlur={() => setTooltip(null)}
                                >
                                    <Icon icon="lucide:ban" width={12} />
                                </S.RuntimeRestriction>
                            )}
                        </S.KeyContainer>
                    </TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent><VariableValue variable={variable} /></TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent><ProviderBadge variable={variable} /></TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent>
                        {variable.vault_integration ? (
                            <S.ConnectionName>
                                <Icon icon="lucide:plug" width={12} />
                                {variable.vault_integration.name}
                            </S.ConnectionName>
                        ) : (
                            <S.ConnectionMissing>-</S.ConnectionMissing>
                        )}
                    </TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent>
                        <S.ScopeBadge $scope={variable.scope} $color={workspaceColor}>
                            <Icon
                                icon={variable.scope === 'workspace'
                                    ? 'lucide:building-2'
                                    : variable.scope === 'team'
                                        ? 'lucide:users-round'
                                        : 'lucide:user'}
                                width={10}
                            />
                            {variable.scope === 'workspace'
                                ? 'Workspace'
                                : variable.scope === 'team'
                                    ? `Team: ${variable.team?.name || '-'}`
                                    : 'Personal'}
                        </S.ScopeBadge>
                    </TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent><S.OwnerName>{variable.user?.name || '-'}</S.OwnerName></TableCellContent>
                </S.Cell>
                <S.Cell>
                    <TableCellContent>
                        <S.Actions>
                            {canEdit && (
                                <>
                                    <S.ActionButton onClick={() => onInspect(variable)} title="Inspect usages">
                                        <Icon icon="lucide:scan-search" width={14} />
                                    </S.ActionButton>
                                    <S.ActionButton onClick={() => onEdit(variable)} title="Edit">
                                        <Icon icon="lucide:pencil" width={14} />
                                    </S.ActionButton>
                                    <S.DangerActionButton onClick={() => onDelete(variable)} title="Delete">
                                        <Icon icon="lucide:trash-2" width={14} />
                                    </S.DangerActionButton>
                                </>
                            )}
                        </S.Actions>
                    </TableCellContent>
                </S.Cell>
            </tr>
            {tooltip && createPortal(
                <S.RuntimeTooltip
                    id={tooltipId}
                    role="tooltip"
                    $available={tooltip.kind === 'reference'}
                    style={{ left: tooltip.left, top: tooltip.top }}
                >
                    <S.RuntimeTooltipBody>
                        {tooltip.kind === 'reference'
                            ? <>Flows you trigger can resolve this value with <code>$vars(&quot;{variable.id}&quot;)</code>.</>
                            : 'You can see this variable, but your runs cannot resolve its value. Usage permission is required.'}
                    </S.RuntimeTooltipBody>
                </S.RuntimeTooltip>,
                document.body,
            )}
        </>
    );
}
