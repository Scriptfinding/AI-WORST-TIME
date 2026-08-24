import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { formatDate } from '@/Shared/Utils/formatDate';
import type { DNSCheckResult, DNSRecord, MailboxDomain } from '@/Domains/Mailbox/types';
import DnsRecordsTable from '@/Domains/Integration/Pages/MailboxDomainModal/components/DnsRecordsTable/DnsRecordsTable';
import DnsVerificationResults from '@/Domains/Integration/Pages/MailboxDomainModal/components/DnsVerificationResults/DnsVerificationResults';
import * as S from './styled';

interface Props {
    domain: MailboxDomain;
    records: DNSRecord[];
    publicIp: string;
    activeTab: 'table' | 'zone';
    zoneFile: string;
    copied: boolean;
    checking: boolean;
    result: DNSCheckResult | null;
    canGoBack: boolean;
    isReadonly: boolean;
    onTabChange: (tab: 'table' | 'zone') => void;
    onCopy: () => void;
    onCheckDns: () => void;
    onBack: () => void;
}

export default function DomainSetupView({
    domain,
    records,
    publicIp,
    activeTab,
    zoneFile,
    copied,
    checking,
    result,
    canGoBack,
    isReadonly,
    onTabChange,
    onCopy,
    onCheckDns,
    onBack,
}: Props) {
    return (
        <>
            <S.InfoGrid>
                <S.InfoCell>
                    <S.InfoCellLabel>Status</S.InfoCellLabel>
                    <S.InfoCellValue>
                        <S.Badge $variant={domain.is_active ? 'success' : 'default'}>
                            {domain.is_active ? 'Active' : 'Inactive'}
                        </S.Badge>
                    </S.InfoCellValue>
                </S.InfoCell>
                <S.InfoCell>
                    <S.InfoCellLabel>Verification</S.InfoCellLabel>
                    <S.InfoCellValue>
                        <S.Badge $variant={domain.is_verified ? 'success' : 'warning'}>
                            {domain.is_verified ? 'Verified' : 'Pending'}
                        </S.Badge>
                    </S.InfoCellValue>
                </S.InfoCell>
                <S.InfoCell>
                    <S.InfoCellLabel>SMTP Host</S.InfoCellLabel>
                    <S.InfoCellValue>mail.{domain.name}</S.InfoCellValue>
                </S.InfoCell>
                <S.InfoCell>
                    <S.InfoCellLabel>Created</S.InfoCellLabel>
                    <S.InfoCellValue>{formatDate(domain.created_at)}</S.InfoCellValue>
                </S.InfoCell>
            </S.InfoGrid>

            <S.SectionTitle>DNS Configuration</S.SectionTitle>
            <S.SectionDescription>
                Add the following DNS records to your domain registrar to receive emails at {domain.name}.
            </S.SectionDescription>
            <S.TabBar>
                <S.TabButton $active={activeTab === 'table'} onClick={() => onTabChange('table')}>
                    Table View
                </S.TabButton>
                <S.TabButton $active={activeTab === 'zone'} onClick={() => onTabChange('zone')}>
                    Zone File
                </S.TabButton>
            </S.TabBar>

            {activeTab === 'table' && <DnsRecordsTable records={records} publicIp={publicIp} />}
            {activeTab === 'zone' && (
                <S.ZoneBlock>
                    <S.ZoneCopyButton onClick={onCopy}>{copied ? 'Copied!' : 'Copy'}</S.ZoneCopyButton>
                    <S.ZoneCode>{zoneFile}</S.ZoneCode>
                </S.ZoneBlock>
            )}

            <S.VerificationSection>
                <S.SectionTitle>DNS Verification</S.SectionTitle>
                <S.SectionDescription>
                    Verify that your DNS records are configured correctly for receiving emails.
                </S.SectionDescription>
                {result && <DnsVerificationResults result={result} />}
            </S.VerificationSection>

            <S.Footer>
                {canGoBack ? (
                    <S.BackLink onClick={onBack}>
                        <Icon icon="lucide:arrow-left" width={13} />
                        Back to domains
                    </S.BackLink>
                ) : <span />}
                {!isReadonly && (
                    <Button size="sm" onClick={onCheckDns} loading={checking}>
                        <Icon icon="lucide:search" width={14} />
                        Check DNS Records
                    </Button>
                )}
            </S.Footer>
        </>
    );
}
