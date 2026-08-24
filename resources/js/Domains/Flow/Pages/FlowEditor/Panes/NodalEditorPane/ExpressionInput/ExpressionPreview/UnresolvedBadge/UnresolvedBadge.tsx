import * as S from './styled';

interface Props {
    label: string;
}

export default function UnresolvedBadge({ label }: Props) {
    return (
        <S.Badge title="Run the flow to preview the real value.">
            <span>Needs run</span>
            <strong>{label}</strong>
        </S.Badge>
    );
}
