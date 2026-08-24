import type { ReactNode } from 'react';
import * as S from './styled';

interface NodalSnapshotFrameProps {
    children: ReactNode;
    flatBottom?: boolean;
}

export default function NodalSnapshotFrame({
    children,
    flatBottom,
}: NodalSnapshotFrameProps) {
    return <S.Wrapper $flatBottom={flatBottom}>{children}</S.Wrapper>;
}
