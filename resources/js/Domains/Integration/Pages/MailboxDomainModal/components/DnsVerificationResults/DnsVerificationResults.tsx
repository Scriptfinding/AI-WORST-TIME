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
            {checks.map(({ key, label }) => (
                <S.Card key={key} $valid={result[key].valid}>
                    <S.CardHeader>
                        <S.StatusDot $valid={result[key].valid}>
                            {result[key].valid ? '✓' : '✗'}
                        </S.StatusDot>
                        <S.Label $valid={result[key].valid}>
                            {label} {result[key].valid ? 'Configured' : 'Missing or Invalid'}
                        </S.Label>
                    </S.CardHeader>
                    <S.Detail>
                        <S.DetailRow>
                            <S.DetailKey>Expected:</S.DetailKey>
                            <S.DetailValue>{result[key].expected}</S.DetailValue>
                        </S.DetailRow>
                        <S.DetailRow>
                            <S.DetailKey>Found:</S.DetailKey>
                            <S.DetailValue>
                                {result[key].found.length > 0 ? result[key].found.join(', ') : 'None'}
                            </S.DetailValue>
                        </S.DetailRow>
                    </S.Detail>
                </S.Card>
            ))}
        </S.Results>
    );
}
