import type { FormEvent } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Switch from '@/Shared/UI/Switch/Switch';
import ScopePicker from '@proprietary/Shared/UI/ScopePicker/ScopePicker.pp';
import UserPicker from '@/Shared/UI/UserPicker/UserPicker';
import * as Layout from '@/Domains/Snippet/Pages/shared.styled';
import type { Snippet } from '@/Domains/Snippet/types';
import type { IntegrationScope } from '@/Domains/Integration/types';
import GroupCombobox from './GroupCombobox/GroupCombobox';
import * as S from './styled';

interface Props {
    snippets: Snippet[];
    snippetGroups: string[];
    teams: { id: Id; name: string }[];
    mobileView: string;
    dirty: boolean;
    saving: boolean;
    switching: boolean;
    readOnly: boolean;
    argsReadOnly: boolean;
    ownershipDisabled: boolean;
    collapsed: boolean;
    onToggleCollapse: () => void;
    label: string;
    onLabelChange: (v: string) => void;
    args: string;
    onArgsChange: (v: string) => void;
    description: string;
    onDescriptionChange: (v: string) => void;
    group: string;
    onGroupChange: (v: string) => void;
    isActive: boolean;
    onIsActiveChange: (v: boolean) => void;
    scope: IntegrationScope;
    teamId: Id | null;
    onScopeChange: (scope: IntegrationScope, teamId: Id | null) => void;
    ownerId: Id | null;
    onOwnerChange: (id: Id | null) => void;
    onOwnerSelect: (u: { workspace_role?: string } | null) => void;
    onSave: () => void;
}

export default function SnippetSettings({
    snippets, snippetGroups, teams, mobileView, dirty, saving, switching, readOnly, argsReadOnly, ownershipDisabled,
    collapsed, onToggleCollapse,
    label, onLabelChange, args, onArgsChange,
    description, onDescriptionChange, group, onGroupChange,
    isActive, onIsActiveChange, scope, teamId, onScopeChange,
    ownerId, onOwnerChange, onOwnerSelect, onSave,
}: Props) {
    if (collapsed) {
        return (
            <S.CollapsedPanel $mobileHidden={mobileView !== 'settings'}>
                <S.CollapseBtn type="button" onClick={onToggleCollapse} title="Expand settings">
                    <Icon icon="lucide:panel-right-close" width={16} />
                </S.CollapseBtn>
            </S.CollapsedPanel>
        );
    }

    return (
        <Layout.Panel $width="320px" $mobileHidden={mobileView !== 'settings'}>
            <Layout.PanelHeader>
                <Layout.PanelHeaderLeft>
                    <Layout.PanelTitle>Settings</Layout.PanelTitle>
                </Layout.PanelHeaderLeft>
                <Layout.PanelHeaderRight>
                    <S.CollapseBtn type="button" onClick={onToggleCollapse} title="Collapse settings">
                        <Icon icon="lucide:panel-right-open" width={16} />
                    </S.CollapseBtn>
                </Layout.PanelHeaderRight>
            </Layout.PanelHeader>
            {switching ? (
                <Layout.PanelLoader><Layout.PanelSpinner /></Layout.PanelLoader>
            ) : (
            <S.SettingsBody as="form" onSubmit={(event: FormEvent) => { event.preventDefault(); if (!readOnly && dirty && !saving) onSave(); }}>
                <S.FieldGroup>
                    <S.FieldLabel>Label</S.FieldLabel>
                    <S.FieldInput
                        value={label}
                        onChange={e => onLabelChange(e.target.value)}
                        placeholder="My Snippet"
                        disabled={readOnly}
                    />
                </S.FieldGroup>

                <S.FieldGroup>
                    <S.FieldLabel>Arguments</S.FieldLabel>
                    <S.FieldInput
                        value={args}
                        onChange={e => onArgsChange(e.target.value)}
                        placeholder="e.g. name, value, options"
                        style={{ fontFamily: "'JetBrains Mono', 'Fira Code', monospace", fontSize: 12 }}
                        disabled={readOnly || argsReadOnly}
                    />
                    <S.FieldHint>{argsReadOnly ? 'Arguments are synced from the library source' : 'Comma-separated parameter names'}</S.FieldHint>
                </S.FieldGroup>

                <S.FieldGroup>
                    <S.FieldLabel>Description (Optional)</S.FieldLabel>
                    <S.FieldTextarea
                        value={description}
                        onChange={e => onDescriptionChange(e.target.value)}
                        placeholder="Description"
                        rows={3}
                        disabled={readOnly}
                    />
                </S.FieldGroup>

                <GroupCombobox
                    value={group}
                    snippets={snippets}
                    snippetGroups={snippetGroups}
                    disabled={readOnly}
                    onChange={onGroupChange}
                />

                <S.FieldGroup>
                    <Switch
                        id="snippet-active"
                        checked={isActive}
                        onChange={v => onIsActiveChange(v)}
                        label="Active"
                        disabled={readOnly}
                    />
                    <S.FieldHint>Inactive snippets are not available at runtime</S.FieldHint>
                </S.FieldGroup>

                <ScopePicker
                    label="Visibility"
                    value={{ scope, team_id: teamId }}
                    teams={teams}
                    ownerLabel="Personal"
                    ownerScope="owner"
                    onChange={v => onScopeChange(v.scope as IntegrationScope, v.team_id)}
                    disabled={readOnly}
                />

                <UserPicker
                    label="Owner"
                    value={ownerId}
                    onChange={id => onOwnerChange(id)}
                    onSelect={u => onOwnerSelect(u)}
                    disabled={readOnly || ownershipDisabled}
                />
            </S.SettingsBody>
            )}
        </Layout.Panel>
    );
}
