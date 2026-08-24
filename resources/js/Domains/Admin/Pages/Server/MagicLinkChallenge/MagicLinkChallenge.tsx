import { Icon } from '@/Shared/UI/Icon/Icon';
import OtpInput, { type OtpInputController } from '@/Domains/Auth/Components/Auth/OtpInput/OtpInput';
import Button from '@/Shared/UI/Button/Button';
import Modal from '@/Shared/UI/Modal/Modal';
import * as S from './styled';

interface Props {
    isOpen: boolean;
    challengeId: string | null;
    email: string;
    otp: OtpInputController;
    error: string;
    processing: boolean;
    resendWait: number;
    onClose: () => void;
    onRequest: () => void;
    onConfirm: () => void;
}

export default function MagicLinkChallenge({
    isOpen,
    challengeId,
    email,
    otp,
    error,
    processing,
    resendWait,
    onClose,
    onRequest,
    onConfirm,
}: Props) {
    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Verify email delivery"
            caption="Passwordless sign-in will remain disabled until the code is verified."
            width="460px"
            footer={
                <>
                    <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={onClose}
                        disabled={processing}
                    >
                        Cancel
                    </Button>
                    {challengeId ? (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onConfirm}
                            loading={processing}
                            disabled={otp.code.length !== 6}
                        >
                            <Icon icon="lucide:shield-check" width={14} height={14} />
                            Enable passwordless sign-in
                        </Button>
                    ) : (
                        <Button
                            type="button"
                            size="sm"
                            onClick={onRequest}
                            loading={processing}
                            disabled={resendWait > 0}
                        >
                            Send code
                        </Button>
                    )}
                </>
            }
        >
            <S.Body>
                <S.Notice>
                    <Icon icon="lucide:mail-check" width={20} height={20} />
                    <span>
                        {challengeId
                            ? <>Enter the six-digit code sent to <strong>{email}</strong>.</>
                            : <>We need to send a code to <strong>{email}</strong> before changing the login method.</>}
                    </span>
                </S.Notice>

                {challengeId && (
                    <S.Form onSubmit={(event) => {
                        event.preventDefault();
                        onConfirm();
                    }}>
                        <OtpInput controller={otp} disabled={processing} />
                    </S.Form>
                )}

                {error && <S.ErrorText>{error}</S.ErrorText>}

                {challengeId && (
                    <S.TextButton
                        type="button"
                        disabled={processing || resendWait > 0}
                        onClick={onRequest}
                    >
                        {resendWait > 0
                            ? `Send a new code in ${resendWait}s`
                            : 'Send a new code'}
                    </S.TextButton>
                )}
            </S.Body>
        </Modal>
    );
}
