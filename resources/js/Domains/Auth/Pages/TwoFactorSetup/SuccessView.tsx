import Button from '@/Shared/UI/Button/Button';
import RecoveryCodes from './RecoveryCodes';
import * as S from './SuccessView.styled';

interface Props {
    recoveryCodes: string[] | null;
}

export default function SuccessView({ recoveryCodes }: Props) {
    return (
        <>
            <S.SuccessTitle>Two-factor authentication is now active</S.SuccessTitle>
            <S.SuccessHint>
                Save these recovery codes in a safe place. You can use them to access your account if you lose your
                authenticator device.
            </S.SuccessHint>
            {recoveryCodes && recoveryCodes.length > 0 && <RecoveryCodes codes={recoveryCodes} />}
            <Button onClick={() => window.location.href = '/'} fullWidth>
                Continue
            </Button>
        </>
    );
}
