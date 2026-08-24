import { Icon } from '@/Shared/UI/Icon/Icon';
import type { ArtifactFile } from '@/Domains/Flow/types';
import { formatFileSize } from '@/Domains/Flow/Pages/FlowEditor/utils/format';
import { getFileIcon } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/ArtifactsTab/utils';
import * as S from './styled';

interface FileListRowProps {
    file: ArtifactFile;
    url: string;
}

export default function FileListRow({ file, url }: FileListRowProps) {
    return (
        <S.Row href={url} target="_blank" title={file.name}>
            <S.Icon>
                <Icon icon={getFileIcon(file.name)} width={14} height={14} />
            </S.Icon>
            <S.Name>{file.name}</S.Name>
            <S.Size>{formatFileSize(file.size)}</S.Size>
        </S.Row>
    );
}
