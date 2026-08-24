import type { ArtifactFile } from '@/Domains/Flow/types';
import { getArtifactUrl } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/ArtifactsTab/utils';
import FileGridCard from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/ArtifactsTab/components/FileGridCard/FileGridCard';
import FileListRow from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/ArtifactsTab/components/FileListRow/FileListRow';
import * as S from './styled';

export type ArtifactViewMode = 'grid' | 'list';

interface ArtifactFileListProps {
    files: ArtifactFile[];
    baseUrl: string;
    viewMode: ArtifactViewMode;
    showPreview?: boolean;
}

export default function ArtifactFileList({
    files,
    baseUrl,
    viewMode,
    showPreview = false,
}: ArtifactFileListProps) {
    if (viewMode === 'list') {
        return (
            <S.List>
                {files.map(file => (
                    <FileListRow
                        key={file.name}
                        file={file}
                        url={getArtifactUrl(baseUrl, file.name)}
                    />
                ))}
            </S.List>
        );
    }

    return (
        <S.Grid>
            {files.map(file => (
                <FileGridCard
                    key={file.name}
                    file={file}
                    url={getArtifactUrl(baseUrl, file.name)}
                    showPreview={showPreview}
                />
            ))}
        </S.Grid>
    );
}
