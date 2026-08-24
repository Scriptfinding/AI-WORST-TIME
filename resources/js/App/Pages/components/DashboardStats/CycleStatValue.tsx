import * as S from './styled';

interface Props {
    used: number;
    limit: number;
}

export default function CycleStatValue({ used, limit }: Props) {
    return (
        <>
            {used}
            <S.StatValueLimit>/{limit}</S.StatValueLimit>
        </>
    );
}
