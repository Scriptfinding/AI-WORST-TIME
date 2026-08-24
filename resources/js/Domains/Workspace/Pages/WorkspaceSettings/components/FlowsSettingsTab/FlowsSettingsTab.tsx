import { Icon } from '@/Shared/UI/Icon/Icon';
import type { Workspace } from '@/Domains/Workspace/types';
import BrowserSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/BrowserSection';
import DebugSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/DebugSection';
import DefaultFlowCodeSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/DefaultFlowCodeSection';
import PerformanceSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/PerformanceSection';
import RetentionSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/RetentionSection';
import TriggersActionsSection from '@/Domains/Workspace/Pages/WorkspaceSettings/Sections/TriggersActionsSection';
import * as S from '@/Domains/Workspace/Pages/WorkspaceSettings/shared.styled';

interface Props {
    workspace: Workspace;
    readOnly: boolean;
}

export default function FlowsSettingsTab({ workspace, readOnly }: Props) {
    return (
        <S.TwoColumns>
            <S.CardStack>
                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:monitor" width={15} height={15} />
                        Browser
                    </S.CardTitle>
                    <BrowserSection workspace={workspace} readOnly={readOnly} />
                </S.Card>

                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:clock" width={15} height={15} />
                        Run Retention
                    </S.CardTitle>
                    <RetentionSection workspace={workspace} readOnly={readOnly} />
                </S.Card>

                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:zap" width={15} height={15} />
                        Triggers & Actions
                    </S.CardTitle>
                    <TriggersActionsSection workspace={workspace} readOnly={readOnly} />
                </S.Card>
            </S.CardStack>

            <S.CardStack>
                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:gauge" width={15} height={15} />
                        Performance
                    </S.CardTitle>
                    <PerformanceSection workspace={workspace} readOnly={readOnly} />
                </S.Card>

                <S.Card>
                    <S.CardTitle>
                        <Icon icon="lucide:bug" width={15} height={15} />
                        Debug
                    </S.CardTitle>
                    <DebugSection workspace={workspace} readOnly={readOnly} />
                </S.Card>
            </S.CardStack>

            <S.WideCard>
                <S.CardTitle>
                    <Icon icon="lucide:workflow" width={15} height={15} />
                    Default Flow
                </S.CardTitle>
                <DefaultFlowCodeSection workspace={workspace} readOnly={readOnly} />
            </S.WideCard>
        </S.TwoColumns>
    );
}
