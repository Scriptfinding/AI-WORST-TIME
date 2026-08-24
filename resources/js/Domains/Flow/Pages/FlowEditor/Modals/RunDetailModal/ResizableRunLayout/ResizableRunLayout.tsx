import type { ReactNode } from 'react';
import { useSplitResize } from '@/Domains/Flow/Pages/FlowEditor/Modals/RunDetailModal/hooks/useRunDetailResize';
import * as S from './styled';

interface ResizableRunLayoutProps {
    codePane: ReactNode;
    children: ReactNode;
}

export default function ResizableRunLayout({ codePane, children }: ResizableRunLayoutProps) {
    const { codePaneWidth, splitRef, startSplitResize } = useSplitResize();

    return (
        <S.Layout ref={splitRef}>
            <S.CodePane style={codePaneWidth ? { flex: 'none', width: codePaneWidth } : { flex: '0 0 45%' }}>
                {codePane}
            </S.CodePane>
            <S.ResizeHandle onMouseDown={startSplitResize} />
            <S.RightPane>{children}</S.RightPane>
        </S.Layout>
    );
}
