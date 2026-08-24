import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ArtifactFile } from '@/Domains/Flow/types';
import { formatFileSize } from '@/Domains/Flow/Pages/FlowEditor/utils/format';
import { getBasename, getDirname, getFileIcon, isImageFile } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/ArtifactsTab/utils';
import * as S from './styled';

interface FileGridCardProps {
    file: ArtifactFile;
    url: string;
    showPreview?: boolean;
}

export default function FileGridCard({ file, url, showPreview = false }: FileGridCardProps) {
    const directory = getDirname(file.name);
    const shouldShowPreview = showPreview && isImageFile(file.name);

    return (
        <S.Card>
            {shouldShowPreview ? (
                <S.Preview href={url} target="_blank">
                    <S.Image src={url} alt={file.name} loading="lazy" />
                </S.Preview>
            ) : (
                <S.IconPreview href={url} target="_blank">
                    <Icon icon={getFileIcon(file.name)} width={28} height={28} />
                </S.IconPreview>
            )}
            <S.Info>
                <S.Name href={url} target="_blank" title={file.name}>
                    {getBasename(file.name)}
                </S.Name>
                {directory && <S.Path title={directory}>{directory}</S.Path>}
                <S.Size>{formatFileSize(file.size)}</S.Size>
            </S.Info>
        </S.Card>
    );
}
