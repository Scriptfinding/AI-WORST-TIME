import { Icon } from '@/Shared/UI/Icon/Icon';
import { LicenseForm, LicenseFilePanel, LicenseFileIcon, LicenseFileInfo, LicenseFileName, LicenseFileLink, LicenseFileMeta, LicenseDropZone, LicenseDropTitle, LicenseDropHint, HiddenFileInput, LicenseActions, LicenseDangerButton } from './ActivationFileSection.styled.pp';
import Button from '@/Shared/UI/Button/Button';
import { formatDateTime } from '@/Shared/Utils/formatDate';
import type { LicenseInfo } from '@/Domains/Admin/Pages/Server/types';
import type { useLicenseActions } from './useLicenseActions.pp';
import * as SharedStyles from '@/Domains/Admin/Pages/Server/shared.styled';

const S = {
    ...SharedStyles,
    HiddenFileInput,
    LicenseActions,
    LicenseDangerButton,
    LicenseDropHint,
    LicenseDropTitle,
    LicenseDropZone,
    LicenseFileIcon,
    LicenseFileInfo,
    LicenseFileLink,
    LicenseFileMeta,
    LicenseFileName,
    LicenseFilePanel,
    LicenseForm,
};

interface Props {
    license: LicenseInfo;
    actions: ReturnType<typeof useLicenseActions>;
}

export default function ActivationFileSection({ license, actions }: Props) {
    const hasLicense = license.file_configured || !!license.file?.imported_at;

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:file-key-2" width={15} height={15} />
                Activation file
            </S.CardTitle>
            <S.LicenseForm onSubmit={actions.upload}>
                {hasLicense && !actions.replacing ? (
                    <>
                        <S.LicenseFilePanel>
                            <S.LicenseFileIcon>
                                <Icon icon="lucide:file-key-2" width={20} height={20} />
                            </S.LicenseFileIcon>
                            <S.LicenseFileInfo>
                                {license.file_configured ? (
                                    <S.LicenseFileLink
                                        href="/admin/server/license/download"
                                        target="_blank"
                                        title="Download the license file"
                                    >
                                        {license.file?.reference || 'puppetflow.license'}
                                    </S.LicenseFileLink>
                                ) : (
                                    <S.LicenseFileName>
                                        {license.file?.reference || 'puppetflow.license'}
                                    </S.LicenseFileName>
                                )}
                                {license.file?.imported_at && (
                                    <S.LicenseFileMeta>
                                        Imported {formatDateTime(license.file.imported_at)}
                                    </S.LicenseFileMeta>
                                )}
                            </S.LicenseFileInfo>
                        </S.LicenseFilePanel>
                        <S.LicenseActions>
                            <S.LicenseDangerButton type="button" onClick={actions.openDeleteModal}>
                                <Icon icon="lucide:trash-2" width={13} height={13} />
                                Delete license
                            </S.LicenseDangerButton>
                            <Button type="button" variant="secondary" size="sm" onClick={actions.startReplacing}>
                                Replace license
                            </Button>
                        </S.LicenseActions>
                    </>
                ) : (
                    <>
                        <S.ToggleDescription>
                            Upload your signed license file (.license or the downloaded .zip) to unlock this instance.
                        </S.ToggleDescription>
                        <S.LicenseDropZone
                            $dragging={actions.dragging}
                            $hasFile={!!actions.file}
                            onDragOver={(event) => {
                                event.preventDefault();
                                actions.setDragging(true);
                            }}
                            onDragLeave={() => actions.setDragging(false)}
                            onDrop={actions.drop}
                        >
                            <Icon icon={actions.file ? 'lucide:file-check-2' : 'lucide:upload-cloud'} width={20} />
                            <S.LicenseDropTitle>
                                {actions.file ? actions.file.name : 'Drop your license file here'}
                            </S.LicenseDropTitle>
                            <S.LicenseDropHint>
                                {actions.file ? 'Click to choose a different file' : 'or click to browse'}
                            </S.LicenseDropHint>
                            <S.HiddenFileInput
                                type="file"
                                accept=".license,.licence,.zip,application/zip,application/octet-stream,text/plain"
                                onClick={(event) => {
                                    event.currentTarget.value = '';
                                }}
                                onChange={(event) => {
                                    const file = event.target.files?.[0];
                                    if (file) actions.setFile(file);
                                }}
                            />
                        </S.LicenseDropZone>
                        <S.LicenseActions>
                            {hasLicense && (
                                <Button
                                    type="button"
                                    variant="secondary"
                                    size="sm"
                                    onClick={actions.cancelReplace}
                                >
                                    Cancel
                                </Button>
                            )}
                            {actions.file && (
                                <Button type="submit" size="sm" loading={actions.uploading}>
                                    {actions.uploading ? 'Activating...' : 'Upload and activate'}
                                </Button>
                            )}
                        </S.LicenseActions>
                    </>
                )}
            </S.LicenseForm>
        </S.Card>
    );
}
