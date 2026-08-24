import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import type { ApiKey } from '@/Domains/Profile/types';
import ApiKeyReveal from './components/ApiKeyReveal/ApiKeyReveal';
import ApiKeysList from './components/ApiKeysList/ApiKeysList';
import CreateApiKeyModal from './components/CreateApiKeyModal/CreateApiKeyModal';
import DeleteApiKeyModal from './components/DeleteApiKeyModal/DeleteApiKeyModal';
import { useApiKeyReveal } from './hooks/useApiKeyReveal';
import { useApiKeySearch } from './hooks/useApiKeySearch';
import { useCreateApiKey } from './hooks/useCreateApiKey';
import { useDeleteApiKey } from './hooks/useDeleteApiKey';
import * as S from './styled';

interface ApiKeysSectionProps {
    apiKeys: ApiKey[];
    newApiKey: string | null;
}

export default function ApiKeysSection({ apiKeys, newApiKey }: ApiKeysSectionProps) {
    const reveal = useApiKeyReveal(newApiKey || null);
    const search = useApiKeySearch(apiKeys);
    const creation = useCreateApiKey({ onCreated: reveal.revealKey });
    const deletion = useDeleteApiKey();

    return (
        <>
            <S.Panel>
                <S.Toolbar>
                    <S.ToolbarText>
                        <S.Title>
                            <Icon icon="lucide:key-round" width={16} height={16} />
                            API Keys
                            <S.KeyCount>({apiKeys.length})</S.KeyCount>
                        </S.Title>
                        <S.Description>
                            Manage keys used by external tools and integrations to access the Puppetflow API.
                        </S.Description>
                    </S.ToolbarText>
                    <Button size="sm" onClick={creation.open}>
                        <Icon icon="lucide:plus" width={14} height={14} />
                        Generate new key
                    </Button>
                </S.Toolbar>

                {reveal.revealedKey && (
                    <ApiKeyReveal
                        apiKey={reveal.revealedKey}
                        onDismiss={reveal.dismissRevealedKey}
                    />
                )}

                <S.DocsLink href="/api/docs" target="_blank" rel="noopener noreferrer">
                    <S.DocsLinkContent>
                        <Icon icon="lucide:book-open" width={18} height={18} />
                        <S.DocsLinkText>
                            <S.DocsLinkTitle>API Documentation</S.DocsLinkTitle>
                            <S.DocsLinkDescription>
                                View the interactive Swagger UI to explore and test all API endpoints.
                            </S.DocsLinkDescription>
                        </S.DocsLinkText>
                    </S.DocsLinkContent>
                    <Icon icon="lucide:external-link" width={14} height={14} />
                </S.DocsLink>

                <ApiKeysList
                    apiKeys={search.filteredKeys}
                    search={search.search}
                    onDelete={deletion.select}
                    onSearchChange={search.setSearch}
                />
            </S.Panel>

            <CreateApiKeyModal
                error={creation.form.errors.name}
                isOpen={creation.isOpen}
                name={creation.form.data.name}
                processing={creation.form.processing}
                onClose={creation.close}
                onNameChange={name => creation.form.setData('name', name)}
                onSubmit={creation.submit}
            />

            <DeleteApiKeyModal
                isOpen={deletion.isOpen}
                onClose={deletion.close}
                onConfirm={deletion.confirm}
            />
        </>
    );
}
