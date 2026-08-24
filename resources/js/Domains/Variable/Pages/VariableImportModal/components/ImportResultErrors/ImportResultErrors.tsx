import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface ImportResultErrorsProps {
    submitError: string | null;
    parseError?: string;
}

export default function ImportResultErrors({ submitError, parseError }: ImportResultErrorsProps) {
    const error = submitError || parseError;
    if (!error) return null;

    return (
        <S.Status>
            <Icon icon="lucide:alert-triangle" width={14} />
            {error}
        </S.Status>
    );
}
