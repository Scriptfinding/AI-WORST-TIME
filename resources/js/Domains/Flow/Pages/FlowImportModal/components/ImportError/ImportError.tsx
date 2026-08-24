import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface Props {
    message: string;
}

export default function ImportError({ message }: Props) {
    return (
        <S.Status>
            <Icon icon="lucide:alert-triangle" width={14} />
            {message}
        </S.Status>
    );
}
