import { Icon } from '@/Shared/UI/Icon/Icon';
import { useToast } from '@/App/Hooks/useToast';
import * as S from './styled';

interface ApiKeyRevealProps {
    apiKey: string;
    onDismiss: () => void;
}

export default function ApiKeyReveal({ apiKey, onDismiss }: ApiKeyRevealProps) {
    const { toast } = useToast();

    const copyKey = () => {
        navigator.clipboard.writeText(apiKey).then(() => toast('Copied to clipboard'));
    };

    return (
        <S.Banner>
            <S.Header>
                <Icon icon="lucide:check-circle" width={16} height={16} />
                New API key created - copy it now, it won't be shown again.
            </S.Header>
            <S.KeyRow>
                <S.KeyValue>{apiKey}</S.KeyValue>
                <S.CopyButton onClick={copyKey} title="Copy">
                    <Icon icon="lucide:copy" width={14} height={14} />
                </S.CopyButton>
            </S.KeyRow>
            <S.DismissButton onClick={onDismiss}>Dismiss</S.DismissButton>
        </S.Banner>
    );
}
