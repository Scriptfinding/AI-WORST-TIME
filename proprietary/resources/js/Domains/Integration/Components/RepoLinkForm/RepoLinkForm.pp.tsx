import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Integration } from '@/Domains/Integration/types';
import ProviderField from './components/ProviderField/ProviderField.pp';
import RepositoryField from './components/RepositoryField/RepositoryField.pp';
import BranchPathFields from './components/BranchPathFields/BranchPathFields.pp';
import { useRepositoryOptions } from './hooks/useRepositoryOptions.pp';
import type { RepoLinkValue } from './types.pp';
import * as S from './styled.pp';

export type { RemoteRepo, RepoLinkValue } from './types.pp';

interface Props {
    integrations: Integration[];
    value: RepoLinkValue;
    onChange: (value: RepoLinkValue) => void;
    compact?: boolean;
}

export default function RepoLinkForm({ integrations, value, onChange, compact }: Props) {
    const selectedIntegration = integrations.find(
        integration => integration.id === value.integration_id,
    );
    const { repos, loadingRepos, branches, loadingBranches } = useRepositoryOptions(
        selectedIntegration?.id ?? null,
        value.repo_full_name,
    );
    const selectedRepo = repos.find(repo => repo.full_name === value.repo_full_name);

    if (integrations.length === 0) {
        return (
            <S.EmptyState $compact={compact}>
                <S.EmptyIcon><Icon icon="lucide:puzzle" width={20} /></S.EmptyIcon>
                <S.EmptyTitle>No Repository Integration</S.EmptyTitle>
                <S.EmptyDesc>
                    Create a repository integration in{' '}
                    <S.EmptyLink href="/integrations">Workspace &rarr; Integrations</S.EmptyLink> first.
                </S.EmptyDesc>
            </S.EmptyState>
        );
    }

    return (
        <S.FormFields>
            <ProviderField
                integrations={integrations}
                selectedIntegration={selectedIntegration}
                onSelect={integrationId => onChange({
                    integration_id: integrationId,
                    repo_full_name: '',
                    branch: '',
                    file_path: value.file_path,
                })}
            />
            {selectedIntegration && (
                <RepositoryField
                    repos={repos}
                    loading={loadingRepos}
                    selectedRepo={selectedRepo}
                    repoFullName={value.repo_full_name}
                    onSelect={repo => onChange({
                        ...value,
                        repo_full_name: repo.full_name,
                        branch: repo.default_branch,
                    })}
                />
            )}
            {value.repo_full_name && (
                <BranchPathFields
                    branches={branches}
                    loading={loadingBranches}
                    branch={value.branch}
                    defaultBranch={selectedRepo?.default_branch}
                    filePath={value.file_path}
                    onBranchChange={branch => onChange({ ...value, branch })}
                    onFilePathChange={filePath => onChange({ ...value, file_path: filePath })}
                />
            )}
        </S.FormFields>
    );
}
