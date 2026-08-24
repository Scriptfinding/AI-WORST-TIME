import type { DNSCheckResult } from '@/Domains/Mailbox/types';
import * as S from './styled';

interface Props {
    result: DNSCheckResult;
}

const checks = [
    { key: 'mx' as const, label: 'MX Record' },
    { key: 'txt' as const, label: 'SPF Record' },
];

export default function DnsVerificationResults({ result }: Props) {
    return (
        <S.Results>
            {checks.map(({ key, label }) => {
                const check = result[key];

                return (
                    <S.Card key={key} $valid={check.valid}>
                        <S.CardHeader>
                            <S.StatusIcon $valid={check.valid}>
                                {check.valid ? '✓' : '✗'}
                            </S.StatusIcon>
                            <S.Title $valid={check.valid}>
                                {label} {check.valid ? 'Configured' : 'Missing or Invalid'}
                            </S.Title>
                        </S.CardHeader>
                        <S.DetailRow>
                            <S.DetailLabel>Expected:</S.DetailLabel>
                            <S.DetailValue>{check.expected}</S.DetailValue>
                        </S.DetailRow>
                        <S.DetailRow>
                            <S.DetailLabel>Found:</S.DetailLabel>
                            <S.DetailValue>
                                {check.found.length > 0 ? check.found.join(', ') : 'None'}
                            </S.DetailValue>
                        </S.DetailRow>
                    </S.Card>
                );
            })}
        </S.Results>
    );
}
