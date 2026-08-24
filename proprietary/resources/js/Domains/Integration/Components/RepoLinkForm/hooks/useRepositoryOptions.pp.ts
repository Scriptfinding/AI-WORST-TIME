import { useCallback, useEffect, useState } from 'react';
import type { RemoteRepo } from '@proprietary/Domains/Integration/Components/RepoLinkForm/types.pp';

// Loads repositories and branches as the RepoLinkForm integration selection changes.
export function useRepositoryOptions(integrationId: Id | null, repoFullName: string) {
    const [repos, setRepos] = useState<RemoteRepo[]>([]);
    const [loadingRepos, setLoadingRepos] = useState(false);
    const [branches, setBranches] = useState<string[]>([]);
    const [loadingBranches, setLoadingBranches] = useState(false);

    const fetchRepos = useCallback(async (id: Id) => {
        setLoadingRepos(true);
        try {
            const response = await fetch(`/integrations/${id}/repositories`);
            const data = await response.json();
            setRepos(Array.isArray(data) ? data : []);
        } catch {
            setRepos([]);
        }
        setLoadingRepos(false);
    }, []);

    const fetchBranches = useCallback(async (id: Id, repository: string) => {
        setLoadingBranches(true);
        try {
            const params = new URLSearchParams({ repo: repository });
            const response = await fetch(`/integrations/${id}/branches?${params}`);
            const data = await response.json();
            setBranches(Array.isArray(data) ? data : []);
        } catch {
            setBranches([]);
        }
        setLoadingBranches(false);
    }, []);

    useEffect(() => {
        if (integrationId) {
            fetchRepos(integrationId);
        } else {
            setRepos([]);
        }
    }, [integrationId, fetchRepos]);

    useEffect(() => {
        if (integrationId && repoFullName) {
            fetchBranches(integrationId, repoFullName);
        } else {
            setBranches([]);
        }
    }, [integrationId, repoFullName, fetchBranches]);

    return { repos, loadingRepos, branches, loadingBranches };
}
