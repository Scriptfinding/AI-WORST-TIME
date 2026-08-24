import { Fragment } from 'react';
import type { Breadcrumb } from '@/Domains/Folder/types';
import type { Flow } from '@/Domains/Flow/types';
import FolderBreadcrumbItem from './components/FolderBreadcrumbItem/FolderBreadcrumbItem';
import FlowBreadcrumbItem from './components/FlowBreadcrumbItem/FlowBreadcrumbItem';
import type { SiblingFlow } from './types';
import * as S from './styled';

interface BreadcrumbsProps {
    breadcrumbs: Breadcrumb[];
    flow: Flow;
    siblingFlows: SiblingFlow[];
}

export default function Breadcrumbs({ breadcrumbs, flow, siblingFlows }: BreadcrumbsProps) {
    return (
        <S.Wrapper>
            {breadcrumbs.map((breadcrumb, index) => (
                <Fragment key={breadcrumb.id ?? `root-${index}`}>
                    {index > 0 && <S.Sep>/</S.Sep>}
                    <FolderBreadcrumbItem breadcrumb={breadcrumb} />
                </Fragment>
            ))}
            <S.Sep>/</S.Sep>
            <FlowBreadcrumbItem flow={flow} siblingFlows={siblingFlows} />
        </S.Wrapper>
    );
}
