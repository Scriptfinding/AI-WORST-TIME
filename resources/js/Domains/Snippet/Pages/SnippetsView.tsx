import { useEffect, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import FeatureUnavailablePanel from '@/Domains/Licensing/Components/FeatureFlags/FeatureUnavailablePanel/FeatureUnavailablePanel';
import LibraryStoreModal from '@/Domains/Library/Components/LibraryStoreModal/LibraryStoreModal';
import Button from '@/Shared/UI/Button/Button';
import * as Layout from '@/Domains/Snippet/Pages/shared.styled';
import SnippetEditor from './SnippetEditor/SnippetEditor';
import SnippetNodalEditor from './SnippetEditor/SnippetNodalEditor';
import SnippetImportModal from './SnippetImportModal/SnippetImportModal';
import SnippetList from './SnippetList/SnippetList';
import SnippetSettings from './SnippetSettings/SnippetSettings';
import SnippetTypePicker from './SnippetTypePicker/SnippetTypePicker';
import type { SnippetsController } from './useSnippetsController';
import * as S from './styled';

interface Props {
    controller: SnippetsController;
}

export default function SnippetsView({ controller }: Props) {
    const [showTypePicker, setShowTypePicker] = useState(false);
    const [selectedIds, setSelectedIds] = useState<Set<Id>>(() => new Set());
    const {
        teams, isAdmin, snippetGroups, snippets, featureEnabled, currentUserId,
        settingsReadOnly, codeReadOnly, ownershipDisabled, resolvedTheme,
        form, navigation, crud, dirtyProtection, libraryUpdate, importGroups,
        showLibraryStore, setShowLibraryStore, showImportModal, setShowImportModal,
        openLibraryStore, downloadSnippet, ConfirmModal,
    } = controller;

    useEffect(() => {
        const availableIds = new Set(snippets.map(snippet => snippet.id));
        setSelectedIds(current => {
            const next = new Set([...current].filter(id => availableIds.has(id)));
            return next.size === current.size ? current : next;
        });
    }, [snippets]);

    const toggleSelected = (snippetId: Id) => {
        setSelectedIds(current => {
            const next = new Set(current);
            if (next.has(snippetId)) {
                next.delete(snippetId);
            } else {
                next.add(snippetId);
            }
            return next;
        });
    };

    const deleteSelected = async () => {
        const deleted = await crud.handleBulkDelete(snippets.filter(snippet => selectedIds.has(snippet.id)));
        if (deleted) setSelectedIds(new Set());
    };

    return (
        <AppLayout
            title="Snippets"
            noPadding
            headerRight={featureEnabled ? (
                <S.HeaderActions>
                    {selectedIds.size > 0 && (
                        <Button
                            variant="danger"
                            size="sm"
                            loading={crud.deletingSelected}
                            onClick={deleteSelected}
                        >
                            <Icon icon="lucide:trash-2" width={14} />
                            Delete ({selectedIds.size})
                        </Button>
                    )}
                    <Button variant="secondary" size="sm" onClick={openLibraryStore}>
                        <Icon icon="lucide:store" width={14} />
                        <S.HeaderButtonLabel>Blueprints</S.HeaderButtonLabel>
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => setShowImportModal(true)}>
                        <Icon icon="lucide:upload" width={14} />
                        <S.HeaderButtonLabel>Import Snippets</S.HeaderButtonLabel>
                    </Button>
                    <Button size="sm" onClick={() => setShowTypePicker(true)}>
                        <Icon icon="lucide:plus" width={14} />
                        <S.HeaderButtonLabel>New Snippet</S.HeaderButtonLabel>
                    </Button>
                </S.HeaderActions>
            ) : undefined}
        >
            {!featureEnabled ? (
                <FeatureUnavailablePanel />
            ) : (
                <>
                    <S.Container>
                        <SnippetList
                            snippets={snippets}
                            active={form.active}
                            mobileView={navigation.mobileView}
                            teams={teams}
                            isAdmin={isAdmin}
                            currentUserId={currentUserId}
                            selectedIds={selectedIds}
                            onToggleSelected={toggleSelected}
                            onLoadSnippet={navigation.loadSnippet}
                            onDelete={crud.handleDelete}
                            onDuplicate={crud.handleDuplicate}
                        />

                        {form.active ? (
                            <SnippetSettings
                                snippets={snippets}
                                snippetGroups={snippetGroups}
                                teams={teams}
                                mobileView={navigation.mobileView}
                                dirty={form.dirty}
                                saving={crud.saving}
                                switching={navigation.switching}
                                readOnly={settingsReadOnly}
                                argsReadOnly={Boolean(form.active.library_locked)}
                                ownershipDisabled={ownershipDisabled}
                                collapsed={navigation.settingsCollapsed}
                                onToggleCollapse={navigation.toggleSettingsCollapsed}
                                label={form.label}
                                onLabelChange={form.setLabel}
                                args={form.args}
                                onArgsChange={form.setArgs}
                                description={form.description}
                                onDescriptionChange={form.setDescription}
                                group={form.group}
                                onGroupChange={form.setGroup}
                                isActive={form.isActive}
                                onIsActiveChange={form.setIsActive}
                                scope={form.scope}
                                teamId={form.teamId}
                                onScopeChange={form.handleScopeChange}
                                ownerId={form.ownerId}
                                onOwnerChange={form.setOwnerId}
                                onOwnerSelect={selected => form.setTargetUserRole(selected?.workspace_role)}
                                onSave={crud.handleSave}
                            />
                        ) : null}

                        {form.active?.snippet_type === 'nodal' ? (
                            <SnippetNodalEditor
                                key={form.active.id}
                                id={form.active.id}
                                args={form.args}
                                graph={form.nodalGraph}
                                dirty={form.dirty}
                                mobileView={navigation.mobileView}
                                readOnly={codeReadOnly}
                                onGraphChange={form.handleNodalGraphChange}
                                onSave={crud.handleSave}
                                onOpenLibraryStore={openLibraryStore}
                                onDownloadSnippet={downloadSnippet}
                                onDuplicateSnippet={() => crud.handleDuplicate(form.active!)}
                                libraryLocked={Boolean(form.active.library_locked)}
                                libraryUpdateAvailable={Boolean(form.active.library_update_available)}
                                updatingLibrarySource={libraryUpdate.updatingLibrarySource}
                                checkingLibraryUpdate={libraryUpdate.checkingLibraryUpdate}
                                onUpdateLibrarySource={form.active.library_update_available ? libraryUpdate.handleUpdateLibrarySource : undefined}
                                onCheckLibraryUpdate={form.active.library_locked ? libraryUpdate.handleCheckLibraryUpdate : undefined}
                            />
                        ) : form.active ? (
                            <SnippetEditor
                                code={form.code}
                                id={form.active.id}
                                args={form.args}
                                dirty={form.dirty}
                                saving={crud.saving}
                                switching={navigation.switching}
                                justSaved={dirtyProtection.justSaved}
                                resolvedTheme={resolvedTheme}
                                mobileView={navigation.mobileView}
                                readOnly={codeReadOnly}
                                canSave={!settingsReadOnly}
                                libraryLocked={Boolean(form.active.library_locked)}
                                libraryUpdateAvailable={Boolean(form.active.library_update_available)}
                                updatingLibrarySource={libraryUpdate.updatingLibrarySource}
                                checkingLibraryUpdate={libraryUpdate.checkingLibraryUpdate}
                                onUpdateLibrarySource={form.active.library_update_available ? libraryUpdate.handleUpdateLibrarySource : undefined}
                                onCheckLibraryUpdate={form.active.library_locked ? libraryUpdate.handleCheckLibraryUpdate : undefined}
                                onSave={crud.handleSave}
                                onOpenLibraryStore={openLibraryStore}
                                onDownloadSnippet={downloadSnippet}
                                onDuplicateSnippet={() => crud.handleDuplicate(form.active!)}
                                onCodeChange={form.handleCodeChange}
                                editorRef={form.editorRef}
                                isInternalChange={form.isInternalChange}
                            />
                        ) : (
                            <Layout.Panel $mobileHidden={navigation.mobileView !== 'editor'}>
                                <Layout.PanelBody>
                                    <Layout.EmptyPanel>Select a snippet to edit its code</Layout.EmptyPanel>
                                </Layout.PanelBody>
                            </Layout.Panel>
                        )}

                        <S.MobileBottomBar>
                            <S.MobileTab $active={navigation.mobileView === 'list'} onClick={() => navigation.setMobileView('list')}>
                                <Icon icon="lucide:code" />
                                <S.MobileTabLabel>Snippets</S.MobileTabLabel>
                            </S.MobileTab>
                            <S.MobileTab
                                $active={navigation.mobileView === 'editor'}
                                onClick={() => navigation.setMobileView('editor')}
                                disabled={!form.active}
                            >
                                <Icon icon="lucide:code-2" />
                                <S.MobileTabLabel>{form.active?.snippet_type === 'nodal' ? 'Nodes' : 'Code'}</S.MobileTabLabel>
                            </S.MobileTab>
                            <S.MobileTab
                                $active={navigation.mobileView === 'settings'}
                                onClick={() => navigation.setMobileView('settings')}
                                disabled={!form.active}
                            >
                                <Icon icon="lucide:settings" />
                                <S.MobileTabLabel>Settings</S.MobileTabLabel>
                            </S.MobileTab>
                        </S.MobileBottomBar>
                    </S.Container>

                    <ConfirmModal />
                    <SnippetImportModal
                        isOpen={showImportModal}
                        onClose={() => setShowImportModal(false)}
                        groups={importGroups}
                        teams={teams}
                        onImport={crud.handleImportSnippet}
                    />
                    <SnippetTypePicker
                        isOpen={showTypePicker}
                        onClose={() => setShowTypePicker(false)}
                        onSelect={type => {
                            setShowTypePicker(false);
                            void crud.handleCreate(type);
                        }}
                    />
                    <LibraryStoreModal
                        isOpen={showLibraryStore}
                        onClose={() => setShowLibraryStore(false)}
                        teams={teams}
                    />
                </>
            )}
        </AppLayout>
    );
}
