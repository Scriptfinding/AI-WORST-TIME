import * as S from './styled';

interface Props {
    copied: boolean;
    onCopy: () => void;
}

export default function CopyControl({ copied, onCopy }: Props) {
    return (
        <S.Button onClick={onCopy}>
            {copied ? 'Copied!' : 'Copy'}
        </S.Button>
    );
}
