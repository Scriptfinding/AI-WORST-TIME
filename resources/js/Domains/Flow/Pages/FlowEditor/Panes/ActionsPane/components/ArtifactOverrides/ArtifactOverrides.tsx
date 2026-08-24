import Switch from '@/Shared/UI/Switch/Switch';
import type { ActionFormData } from '@/Domains/Flow/Pages/FlowEditor/Panes/ActionsPane/types';
import * as S from './styled';

type ArtifactField =
    | 'export_artifacts_screenshots'
    | 'export_artifacts_downloads'
    | 'export_artifacts_recording';

interface ArtifactOverridesProps {
    data: Pick<ActionFormData, ArtifactField>;
    recordingEnabled: boolean;
    onChange: (field: ArtifactField, value: boolean) => void;
}

export default function ArtifactOverrides({
    data,
    recordingEnabled,
    onChange,
}: ArtifactOverridesProps) {
    return (
        <>
            <S.Separator />
            <S.Label>Artifacts</S.Label>
            <S.Hint>
                Override flow-level artifact export settings for this action. When null, inherits the flow setting.
            </S.Hint>

            <Switch
                id="action-export-screenshots"
                checked={data.export_artifacts_screenshots ?? true}
                onChange={value => onChange('export_artifacts_screenshots', value)}
                label="Screenshots in output"
            />

            <Switch
                id="action-export-downloads"
                checked={data.export_artifacts_downloads ?? true}
                onChange={value => onChange('export_artifacts_downloads', value)}
                label="Downloads in output"
            />

            {recordingEnabled && (
                <Switch
                    id="action-export-recording"
                    checked={data.export_artifacts_recording ?? true}
                    onChange={value => onChange('export_artifacts_recording', value)}
                    label="Recording in output"
                />
            )}
        </>
    );
}
