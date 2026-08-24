import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import * as S from './RecoveryCodes.styled';

interface Props {
    codes: string[];
}

export default function RecoveryCodes({ codes }: Props) {
    const handleDownload = () => {
        const blob = new Blob([codes.join('\n')], { type: 'text/plain' });
        const url = URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = 'recovery-codes.txt';
        anchor.click();
        URL.revokeObjectURL(url);
    };

    return (
        <>
            <S.RecoveryCodes>
                {codes.map((code, index) => (
                    <S.RecoveryCode key={index}>{code}</S.RecoveryCode>
                ))}
            </S.RecoveryCodes>
            <S.RecoveryActions>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => navigator.clipboard.writeText(codes.join('\n'))}
                >
                    <Icon icon="lucide:copy" width={14} height={14} />
                    Copy
                </Button>
                <Button variant="secondary" size="sm" onClick={handleDownload}>
                    <Icon icon="lucide:download" width={14} height={14} />
                    Download
                </Button>
            </S.RecoveryActions>
        </>
    );
}
