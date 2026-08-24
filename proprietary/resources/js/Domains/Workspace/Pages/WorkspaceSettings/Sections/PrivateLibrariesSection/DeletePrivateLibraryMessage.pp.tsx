import { useState, type ChangeEvent } from 'react';
import * as S from '@proprietary/Domains/Workspace/Pages/WorkspaceSettings/Sections/PrivateLibrariesSection/DeletePrivateLibraryMessage.styled.pp';

interface Props {
    onDeleteImportsChange: (value: boolean) => void;
}

export default function DeletePrivateLibraryMessage({ onDeleteImportsChange }: Props) {
    const [deleteImports, setDeleteImports] = useState(false);

    const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
        setDeleteImports(event.target.checked);
        onDeleteImportsChange(event.target.checked);
    };

    return (
        <S.Body>
            <S.Message>
                Deleting this private library removes it from the blueprint store and temporarily breaks the link used to check updates for imported flows and snippets.<br /><br />If you add the same repository again, matching imports can reconnect through their namespace and reference.
            </S.Message>
            <S.OptionLabel>
                <S.Checkbox type="checkbox" checked={deleteImports} onChange={handleChange} />
                <span>
                    <strong>Delete imported items too</strong>
                    <small>Also delete flows and snippets that were imported from this private library.</small>
                </span>
            </S.OptionLabel>
            {deleteImports && (
                <S.Warning>
                    This will permanently delete the linked imported flows and snippets from this workspace.
                </S.Warning>
            )}
        </S.Body>
    );
}
