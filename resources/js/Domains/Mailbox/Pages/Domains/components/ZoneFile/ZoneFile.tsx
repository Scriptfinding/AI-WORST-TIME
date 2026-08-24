import CopyControl from '@/Domains/Mailbox/Pages/Domains/components/CopyControl/CopyControl';
import * as S from './styled';

interface Props {
    content: string;
    copied: boolean;
    onCopy: () => void;
}

export default function ZoneFile({ content, copied, onCopy }: Props) {
    return (
        <S.Block>
            <CopyControl copied={copied} onCopy={onCopy} />
            <S.Code>{content}</S.Code>
        </S.Block>
    );
}
