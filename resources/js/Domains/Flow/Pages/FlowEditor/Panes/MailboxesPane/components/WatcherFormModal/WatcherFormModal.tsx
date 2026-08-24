import Modal from '@/Shared/UI/Modal/Modal';
import { SettingsForm } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';
import FormFooter from './components/FormFooter/FormFooter';
import IdentityMailboxFields from './components/IdentityMailboxFields/IdentityMailboxFields';
import RulesExtractionFields from './components/RulesExtractionFields/RulesExtractionFields';
import ScopeOwnershipFields from './components/ScopeOwnershipFields/ScopeOwnershipFields';
import useWatcherForm from './hooks/useWatcherForm';
import type { WatcherFormModalProps } from './types';

export default function WatcherFormModal({
    isOpen,
    editing,
    flowId,
    isNodalFlow,
    groups,
    mailboxes,
    teams,
    confirm,
    onClose,
    onCreated,
    onUpdated,
    zIndex,
    quickMode,
}: WatcherFormModalProps) {
    const form = useWatcherForm({
        isOpen,
        editing,
        flowId,
        isNodalFlow,
        groups,
        mailboxes,
        teams,
        confirm,
        onClose,
        onCreated,
        onUpdated,
    });
    const { values, updateField } = form;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={editing ? 'Edit Watcher' : 'New Mailbox Watcher'}
            zIndex={zIndex}
            modalKind={quickMode ? 'mailbox-watcher-quick-create' : undefined}
        >
            <SettingsForm onSubmit={form.handleSubmit}>
                <IdentityMailboxFields
                    isOpen={isOpen}
                    editingId={editing?.id}
                    editingGroup={editing?.group}
                    groups={groups}
                    mailboxes={mailboxes}
                    name={values.name}
                    group={values.group}
                    mailboxId={values.mailboxId}
                    isActive={values.isActive}
                    onNameChange={value => updateField('name', value)}
                    onGroupChange={value => updateField('group', value)}
                    onMailboxChange={value => updateField('mailboxId', value)}
                    onActiveChange={value => updateField('isActive', value)}
                />
                <RulesExtractionFields
                    isNodalFlow={isNodalFlow}
                    rules={values.rules}
                    extractEnabled={values.extractEnabled}
                    extractMode={values.extractMode}
                    extractExpr={values.extractExpr}
                    timeout={values.timeout}
                    onAddRule={form.addRule}
                    onAddRuleGroup={form.addRuleGroup}
                    onUpdateRule={form.updateRule}
                    onRemoveRule={form.removeRule}
                    onExtractEnabledChange={value => updateField('extractEnabled', value)}
                    onExtractModeChange={value => updateField('extractMode', value)}
                    onExtractExprChange={value => updateField('extractExpr', value)}
                    onTimeoutChange={value => updateField('timeout', value)}
                />
                <ScopeOwnershipFields
                    editing={!!editing}
                    scope={values.scope}
                    teamId={values.teamId}
                    ownerId={values.ownerId}
                    teams={teams}
                    disabled={form.ownershipDisabled}
                    onScopeChange={(scope, teamId) => {
                        updateField('scope', scope);
                        updateField('teamId', teamId);
                    }}
                    onOwnerChange={value => updateField('ownerId', value)}
                    onOwnerRoleChange={value => updateField('targetUserRole', value)}
                />
                <FormFooter
                    saving={form.saving}
                    editing={!!editing}
                    disabled={!values.name.trim() || !values.mailboxId}
                />
            </SettingsForm>
        </Modal>
    );
}
