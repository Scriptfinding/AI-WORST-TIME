import DataInspector from '@/Domains/Flow/Pages/FlowEditor/Panes/NodalEditorPane/DataInspector/DataInspector';
import * as S from './styled';

interface PreviewSectionProps {
    title: 'Before' | 'After';
    value: unknown;
    copyValue: unknown;
    emptyText: string;
    flowId?: Id;
}

export default function PreviewSection(props: PreviewSectionProps) {
    return (
        <S.Pane>
            <DataInspector
                {...props}
                rootPath="$"
                tabStorageKey={`puppetflow:node-config:${props.title.toLowerCase()}:inspector-tab`}
            />
        </S.Pane>
    );
}
