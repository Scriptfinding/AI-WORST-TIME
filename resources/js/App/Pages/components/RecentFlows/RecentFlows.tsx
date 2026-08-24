import FlowCard from '@/Domains/Flow/Components/Flow/FlowCard/FlowCard';
import type { Flow } from '@/Domains/Flow/types';
import * as S from './styled';

interface Props {
    flows: Flow[];
}

export default function RecentFlows({ flows }: Props) {
    return (
        <S.Section>
            <S.SectionTitle>Recent Flows</S.SectionTitle>
            <S.FlowList>
                {flows.map(flow => (
                    <FlowCard key={flow.id} flow={flow} />
                ))}
            </S.FlowList>
        </S.Section>
    );
}
