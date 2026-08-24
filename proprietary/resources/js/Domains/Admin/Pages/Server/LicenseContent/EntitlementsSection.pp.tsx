import { Icon } from '@/Shared/UI/Icon/Icon';
import {
    FlagBoolean,
    FlagName,
    FlagRow,
    FlagsColumn,
    FlagsSection,
    FlagsTable,
    FlagValue,
    Section,
    SectionTitle,
} from './EntitlementsSection.styled.pp';
import type { FeatureFlagValue, LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import { formatFlagName, formatFlagValue } from '@/Domains/Admin/Pages/Server/utils';
import * as SharedStyles from '@/Domains/Admin/Pages/Server/shared.styled';

const S = {
    ...SharedStyles,
    FlagBoolean,
    FlagName,
    FlagRow,
    FlagsColumn,
    FlagsSection,
    FlagsTable,
    FlagValue,
    Section,
    SectionTitle,
};

interface Props {
    featureFlags: LicenseInfo['feature_flags'];
}

type EntitlementSection =
    | 'Automation & execution'
    | 'Debugging'
    | 'Integrations & data'
    | 'Access & collaboration'
    | 'Branding'
    | 'Limits & support'
    | 'Core capabilities';
type EntitlementEntry = [string, FeatureFlagValue];

const SECTION_COLUMNS: EntitlementSection[][] = [
    ['Automation & execution', 'Debugging', 'Access & collaboration', 'Branding'],
    ['Integrations & data', 'Limits & support', 'Core capabilities'],
];

const FLAG_SECTIONS: Record<string, EntitlementSection> = {
    snippets_enabled: 'Automation & execution',
    variables_enabled: 'Automation & execution',
    recording_enabled: 'Automation & execution',
    live_view_enabled: 'Automation & execution',
    run_metadata_search_enabled: 'Debugging',
    mcp_enabled: 'Integrations & data',
    private_libraries_enabled: 'Integrations & data',
    vaults_enabled: 'Integrations & data',
    messenger_enabled: 'Integrations & data',
    mailbox_enabled: 'Integrations & data',
    ai_enabled: 'Integrations & data',
    vcs_enabled: 'Access & collaboration',
    teams_enabled: 'Access & collaboration',
    workspace_sharing_enabled: 'Access & collaboration',
    two_factor_enforcement_enabled: 'Access & collaboration',
    sso_enabled: 'Access & collaboration',
    whitelabel_enabled: 'Branding',
    workspace_limit: 'Limits & support',
    concurrent_runs_limit: 'Limits & support',
    maximum_retention_limit: 'Limits & support',
    maximum_timeout_seconds: 'Limits & support',
    maximum_retries_limit: 'Limits & support',
};

const INTERNAL_FLAGS = new Set([
    'cycle_epoch',
    'cycle_freq',
    'cycle_runs_limit',
    'instance_storage_limit_bytes',
    'promote_disabled_features',
    'promote_disabled_features_reason',
    'github_stargazers',
]);

function formatEntitlementValue(key: string, value: FeatureFlagValue): string {
    if (
        value === 0
        && ['maximum_retention_limit', 'maximum_timeout_seconds'].includes(key)
    ) {
        return 'Unlimited';
    }

    return formatFlagValue(value);
}

export default function EntitlementsSection({ featureFlags }: Props) {
    const groupedFlags = Object.entries(featureFlags ?? {})
        .filter(([key]) => !INTERNAL_FLAGS.has(key))
        .reduce<Map<EntitlementSection, EntitlementEntry[]>>((groups, entry) => {
            const section = FLAG_SECTIONS[entry[0]] ?? 'Core capabilities';
            const flags = groups.get(section) ?? [];
            flags.push(entry);
            groups.set(section, flags);
            return groups;
        }, new Map());

    if (groupedFlags.size === 0) return null;

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:list-checks" width={15} height={15} />
                Entitlements
            </S.CardTitle>
            <S.FlagsSection>
                {SECTION_COLUMNS.map((sections, columnIndex) => (
                    <S.FlagsColumn key={columnIndex}>
                        {sections.map((section) => {
                            const flags = groupedFlags.get(section);
                            if (!flags) return null;
                            const sortedFlags = [...flags].sort(
                                ([, firstValue], [, secondValue]) =>
                                    Number(firstValue === false) - Number(secondValue === false),
                            );

                            return (
                                <S.Section key={section}>
                                    <S.SectionTitle>{section}</S.SectionTitle>
                                    <S.FlagsTable>
                                        {sortedFlags.map(([key, value]) => (
                                            <S.FlagRow key={key}>
                                                <S.FlagName>{formatFlagName(key)}</S.FlagName>
                                                {typeof value === 'boolean' ? (
                                                    <S.FlagBoolean
                                                        $enabled={value}
                                                        aria-label={value ? 'Enabled' : 'Disabled'}
                                                        title={value ? 'Enabled' : 'Disabled'}
                                            />
                                                ) : (
                                                    <S.FlagValue>{formatEntitlementValue(key, value)}</S.FlagValue>
                                                )}
                                            </S.FlagRow>
                                        ))}
                                    </S.FlagsTable>
                                </S.Section>
                            );
                        })}
                    </S.FlagsColumn>
                ))}
            </S.FlagsSection>
        </S.Card>
    );
}
