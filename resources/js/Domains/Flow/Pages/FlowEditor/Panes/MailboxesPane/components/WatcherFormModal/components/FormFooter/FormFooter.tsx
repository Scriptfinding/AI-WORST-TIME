import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

interface FormFooterProps {
    saving: boolean;
    editing: boolean;
    disabled: boolean;
}

export default function FormFooter({ saving, editing, disabled }: FormFooterProps) {
    return (
        <S.Actions>
            <Button type="submit" size="sm" disabled={saving || disabled}>
                {saving ? 'Saving...' : editing ? 'Update Watcher' : 'Create Watcher'}
            </Button>
        </S.Actions>
    );
}
