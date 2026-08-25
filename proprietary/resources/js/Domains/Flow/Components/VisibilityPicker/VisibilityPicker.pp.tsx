/*
 * Portions of this file implement paid Puppetflow features (teams and
 * workspace sharing) and are licensed under the Puppetflow Proprietary
 * License. See LICENSE_PROPRIETARY.md.
 */
import { usePageProps } from '@/App/Hooks/usePageProps';
import FolderTargetPickers from './components/FolderTargetPickers/FolderTargetPickers.pp';
import VisibilitySelector from './components/VisibilitySelector/VisibilitySelector.pp';
import type { VisibilityPickerProps } from './types.pp';
import * as S from './styled.pp';

export type { Visibility, VisibilityPickerValue } from './types.pp';

export default function VisibilityPicker({
    value,
    onChange,
    personalTree,
    workspaceTree,
    teamTrees,
    ownerId = null,
    ownerChanged = false,
    disabled,
    disabledHint,
}: VisibilityPickerProps) {
    const { settings } = usePageProps();
    const workspaceSharingEnabled =
        settings?.workspace_sharing_enabled ?? false;
    const teamsEnabled = settings?.teams_enabled ?? false;
    const effectiveValue = (
        (value.visibility === 'workspace' && !workspaceSharingEnabled)
        || (value.visibility === 'team' && !teamsEnabled)
    )
        ? {
              ...value,
              visibility: 'owner' as const,
              wsFolderId: null,
              teamId: null,
              teamFolderId: null,
          }
        : value;

    return (
        <S.PickerWrapper $disabled={disabled}>
            {disabled && disabledHint && (
                <S.DisabledHint>{disabledHint}</S.DisabledHint>
            )}
            <VisibilitySelector
                value={effectiveValue.visibility}
                teamsEnabled={teamsEnabled}
                workspaceSharingEnabled={workspaceSharingEnabled}
                showDisabledFeatures={settings?.promote_disabled_features ?? false}
                disabledFeatureMessage={settings?.disabled_feature_message ?? ''}
                disabled={disabled}
                onChange={(visibility) =>
                    onChange({ ...value, visibility })
                }
            />
            <FolderTargetPickers
                value={effectiveValue}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
                ownerId={ownerId}
                ownerChanged={ownerChanged}
                onChange={onChange}
            />
        </S.PickerWrapper>
    );
}
