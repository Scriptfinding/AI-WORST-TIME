import { Icon } from '@/Shared/UI/Icon/Icon';
import type { CanvasNode } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/types';
import {
    formatEntryLabel,
    getEntryByName,
    getNodeCategoryColor,
    getNodeIcon,
} from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/catalog';
import { getMissingRequiredParameters } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/utils/validation';
import { useNodeValidationResources } from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/contexts/NodeValidationContext';
import * as S from './styled';

interface ConnectedNodeCardProps {
    node: CanvasNode;
    onClick: () => void;
}

export default function ConnectedNodeCard({ node, onClick }: ConnectedNodeCardProps) {
    const validationResources = useNodeValidationResources();
    const entry = node.system ? node.entry : getEntryByName(node.entry.name);
    const validationIssues = node.system
        ? []
        : getMissingRequiredParameters(entry, node.values, undefined, validationResources);
    const invalid = validationIssues.length > 0;
    const displayLabel = node.system === 'terminate'
        ? 'FINALLY'
        : node.label?.trim() || formatEntryLabel(entry);

    return (
        <S.NodeButton
            type="button"
            $invalid={invalid}
            onClick={event => {
                event.stopPropagation();
                onClick();
            }}
            title={`Open ${displayLabel}`}
        >
            <S.NodeTile $invalid={invalid}>
                <S.NodeIcon $color={getNodeCategoryColor(entry)}>
                    <Icon icon={getNodeIcon(entry)} width={24} height={24} />
                </S.NodeIcon>
            </S.NodeTile>
            <S.NodeLabel>{displayLabel}</S.NodeLabel>
        </S.NodeButton>
    );
}
