import type { Flow } from '@/Domains/Flow/types';
import type { FlowCardController } from '@/Domains/Flow/Components/Flow/FlowCard/hooks/useFlowCardController';
import type { FlowCardVariant } from '@/Domains/Flow/Components/Flow/FlowCard/types';
import FlowCardHeader from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardHeader/FlowCardHeader';
import FlowCardMetadata from '@/Domains/Flow/Components/Flow/FlowCard/components/FlowCardMetadata/FlowCardMetadata';
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

export default function FlowCardContent(props: Props) {
    const { flow, variant, selectable, selected, onToggleSelect } = props;

    return (
        <>
            <FlowCardHeader {...props} />
            {variant === 'grid' && flow.description && (
                <S.Description>{flow.description}</S.Description>
            )}
            {variant === 'grid' && (
                <FlowCardMetadata
                    flow={flow}
                    variant={variant}
                    selectable={selectable}
                    selected={selected}
                    onToggleSelect={onToggleSelect}
                />
            )}
        </>
    );
}
