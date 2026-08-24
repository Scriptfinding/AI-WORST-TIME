import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

interface DangerSectionProps {
    onDelete: () => Promise<void>;
}

export default function DangerSection({ onDelete }: DangerSectionProps) {
    return (
        <S.DangerZone>
            <S.DangerZoneTitle>
                <Icon icon="lucide:triangle-alert" width={13} height={13} />
                Danger Zone
            </S.DangerZoneTitle>
            <S.DangerZoneDescription>
                Permanently delete this flow and all its run history. This action cannot be undone.
            </S.DangerZoneDescription>
            <Button variant="danger" size="sm" onClick={onDelete}>
                <Icon icon="lucide:trash-2" width={13} height={13} />
                Delete Flow
            </Button>
        </S.DangerZone>
    );
}
