import { Icon } from '@/Shared/UI/Icon/Icon';
import Badge from '@/Shared/UI/Badge/Badge';
import type { Flow } from '@/Domains/Flow/types';
import type { FlowCardController } from '@/Domains/Flow/Components/Flow/FlowCard/hooks/useFlowCardController';
import type { FlowCardVariant } from '@/Domains/Flow/Components/Flow/FlowCard/types';
import FlowCardActionsMenu from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardActionsMenu/FlowCardActionsMenu';
import FlowCardMetadata from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardMetadata/FlowCardMetadata';
import FlowCardSelectableIcon from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardSelectableIcon/FlowCardSelectableIcon';
import * as S from './styled';

interface Props {
    flow: Flow;
    variant: FlowCardVariant;
    canEdit: boolean;
    selectable: boolean;
    selected: boolean;
    onToggleSelect?: (flow: Flow) => void;
    controller: FlowCardController;
}

const visibilityDetails = {
    owner: { icon: 'lucide:user', title: 'Owner only' },
    team: { icon: 'lucide:users', title: 'Team' },
    workspace: { icon: 'lucide:building-2', title: 'Workspace' },
} as const;

export default function FlowCardHeader({
    flow,
    variant,
    canEdit,
    selectable,
    selected,
    onToggleSelect,
    controller,
}: Props) {
    const visibility = visibilityDetails[flow.visibility];

    return (
        <S.Header $variant={variant}>
            {variant === 'list' && (
                <FlowCardSelectableIcon
                    flow={flow}
                    size={22}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={onToggleSelect}
                />
            )}
            <S.Left>
                <S.Name $variant={variant}>{flow.name}</S.Name>
            </S.Left>
            <S.Right $variant={variant}>
                {flow.library_reference && (
                    <S.ImportedTag title="Imported from library">
                        <Icon icon="lucide:store" />
                    </S.ImportedTag>
                )}
                <S.VisibilityTag $visibility={flow.visibility} title={visibility.title}>
                    <Icon icon={visibility.icon} />
                </S.VisibilityTag>
                <Badge variant={flow.is_published ? 'success' : 'default'} dot>
                    {flow.is_published ? 'Published' : 'Unpublished'}
                </Badge>
                {variant === 'list' && (
                    <FlowCardMetadata
                        flow={flow}
                        variant={variant}
                        selectable={selectable}
                        selected={selected}
                        onToggleSelect={onToggleSelect}
                    />
                )}
                <FlowCardActionsMenu
                    canEdit={canEdit}
                    visibility={flow.visibility}
                    controller={controller}
                />
            </S.Right>
        </S.Header>
    );
}
