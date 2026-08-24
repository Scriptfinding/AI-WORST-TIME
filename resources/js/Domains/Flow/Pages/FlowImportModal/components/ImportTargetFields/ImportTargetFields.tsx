import Input, { TextArea } from '@/Shared/UI/Input/Input';
import VisibilityPicker, { type VisibilityPickerValue } from '@proprietary/Domains/Flow/Components/VisibilityPicker/VisibilityPicker.pp';
import type { FolderTree, TeamTree } from '@/Domains/Folder/types';
import type { ParsedFlowFile } from '@/Domains/Flow/Pages/FlowImportModal/utils';
import * as S from './styled';

interface Props {
    name: string;
    description: string;
    parsedFile: ParsedFlowFile;
    visibility: VisibilityPickerValue;
    personalTree: FolderTree[];
    workspaceTree: FolderTree[];
    teamTrees: TeamTree[];
    onNameChange: (name: string) => void;
    onDescriptionChange: (description: string) => void;
    onVisibilityChange: (visibility: VisibilityPickerValue) => void;
}

export default function ImportTargetFields({
    name,
    description,
    parsedFile,
    visibility,
    personalTree,
    workspaceTree,
    teamTrees,
    onNameChange,
    onDescriptionChange,
    onVisibilityChange,
}: Props) {
    return (
        <>
            <S.TwoColumn>
                <Input
                    label="Flow name"
                    value={name}
                    onChange={event => onNameChange(event.target.value)}
                    placeholder="Imported Flow"
                />
                <Input
                    label="Type"
                    value={parsedFile.flowType === 'nodal' ? 'Visual Builder' : 'Raw Code'}
                    disabled
                />
            </S.TwoColumn>

            <TextArea
                label="Description"
                value={description}
                onChange={event => onDescriptionChange(event.target.value)}
                placeholder="What does this flow do?"
            />

            <VisibilityPicker
                value={visibility}
                onChange={onVisibilityChange}
                personalTree={personalTree}
                workspaceTree={workspaceTree}
                teamTrees={teamTrees}
            />
        </>
    );
}
