import { useAuth } from '@/App/Hooks/usePageProps';
import { handleLinkClick } from '@/Shared/Utils/navigation';
import FlowCardContent from './components/FlowCardContent/FlowCardContent';
import FlowCardModals from './components/FlowCardModals/FlowCardModals';
import { useFlowCardController } from './hooks/useFlowCardController';
import type { FlowCardProps } from './types';
import * as S from './styled';

export default function FlowCard({
    flow,
    variant = 'grid',
    workspaceTree = [],
    personalTree = [],
    teamTrees = [],
    userTrees = [],
    selectionActive = false,
    selected = false,
    onToggleSelect,
}: FlowCardProps) {
    const { user } = useAuth();
    const controller = useFlowCardController(flow);
    const canEdit = Boolean(
        user && (
            user.role === 'admin' ||
            user.workspace_role === 'admin' ||
            flow.owner_id === user.id
        )
    );
    const selectable = canEdit && Boolean(onToggleSelect);

    const handleCardClick = (event: React.MouseEvent<HTMLAnchorElement>) => {
        if (selectionActive && selectable) {
            event.preventDefault();
            event.stopPropagation();
            onToggleSelect?.(flow);
            return;
        }

        handleLinkClick(event, `/flows/${flow.id}`);
    };

    const handleDragStart = (event: React.DragEvent) => {
        if (!canEdit) {
            event.preventDefault();
            return;
        }

        event.dataTransfer.setData('application/x-drag-type', 'flow');
        event.dataTransfer.setData('application/x-drag-id', String(flow.id));
        event.dataTransfer.setData('application/x-drag-visibility', flow.visibility);
        event.dataTransfer.setData('application/x-drag-team-id', flow.team_id === null ? '' : String(flow.team_id));
        event.dataTransfer.effectAllowed = 'move';
    };

    return (
        <>
            <S.Card
                $variant={variant}
                $selected={selected}
                $selectionActive={selectionActive}
                href={`/flows/${flow.id}`}
                onClick={handleCardClick}
                draggable={canEdit}
                onDragStart={handleDragStart}
            >
                <FlowCardContent
                    flow={flow}
                    variant={variant}
                    canEdit={canEdit}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={onToggleSelect}
                    controller={controller}
                />
            </S.Card>
            <FlowCardModals
                flow={flow}
                canEdit={canEdit}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                userTrees={userTrees}
                controller={controller}
            />
        </>
    );
}
