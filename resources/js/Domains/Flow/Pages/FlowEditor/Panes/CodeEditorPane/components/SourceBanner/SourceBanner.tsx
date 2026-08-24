import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface SourceBannerProps {
    updateAvailable: boolean;
    updating: boolean;
    checking: boolean;
    onUpdate?: () => void;
    onCheck?: () => void;
}

export function SourceBanner({
    updateAvailable,
    updating,
    checking,
    onUpdate,
    onCheck,
}: SourceBannerProps) {
    return (
        <S.Banner $outdated={updateAvailable}>
            <S.Text>
                <Icon icon={updateAvailable ? 'lucide:refresh-cw' : 'lucide:download'} width={14} />
                {updateAvailable
                    ? 'A newer library version is available. Updating replaces code only and keeps triggers, inputs and settings.'
                    : 'This flow was imported from the library. Code is locked, but triggers, inputs and settings can still be edited.'}
            </S.Text>
            {updateAvailable && onUpdate ? (
                <S.UpdateButton type="button" onClick={onUpdate} disabled={updating || checking}>
                    {updating ? 'Updating...' : 'Update'}
                </S.UpdateButton>
            ) : onCheck ? (
                <S.UpdateButton type="button" onClick={onCheck} disabled={checking || updating}>
                    {checking ? 'Checking...' : 'Check for updates'}
                </S.UpdateButton>
            ) : null}
        </S.Banner>
    );
}
