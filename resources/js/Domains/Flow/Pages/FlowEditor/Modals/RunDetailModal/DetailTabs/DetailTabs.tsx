import { Icon } from '@/Shared/UI/Icon/Icon';
import type { FlowRun } from '@/Domains/Flow/types';
import * as S from './styled';

export type DetailTab = 'code' | 'data' | 'console' | 'trigger' | 'artifacts' | 'browser';

interface DetailTabsProps {
    activeTab: DetailTab;
    run: FlowRun;
    isActive: boolean;
    onChange: (tab: DetailTab) => void;
}

export default function DetailTabs({ activeTab, run, isActive, onChange }: DetailTabsProps) {
    return (
        <S.Tabs>
            <S.MobileOnlyTab $active={activeTab === 'code'} onClick={() => onChange('code')}>
                <Icon icon="lucide:code-2" width={12} height={12} />
                Code
            </S.MobileOnlyTab>
            <S.Tab $active={activeTab === 'browser'} onClick={() => onChange('browser')}>
                {isActive ? (
                    <>
                        <Icon icon="lucide:monitor-play" width={12} height={12} />
                        Live
                        <S.LiveIndicator />
                    </>
                ) : run.has_recording ? (
                    <>
                        <Icon icon="lucide:video" width={12} height={12} />
                        Recording
                    </>
                ) : (
                    <>
                        <Icon icon="lucide:monitor-play" width={12} height={12} />
                        Live
                    </>
                )}
            </S.Tab>
            <S.Tab $active={activeTab === 'data'} onClick={() => onChange('data')}>
                <Icon icon="lucide:database" width={12} height={12} />
                Data
            </S.Tab>
            <S.MobileOnlyTab $active={activeTab === 'console'} onClick={() => onChange('console')}>
                <Icon icon="lucide:terminal" width={12} height={12} />
                Console
            </S.MobileOnlyTab>
            <S.Tab $active={activeTab === 'trigger'} onClick={() => onChange('trigger')}>
                <Icon icon="lucide:zap" width={12} height={12} />
                Trigger & Actions
            </S.Tab>
            <S.Tab $active={activeTab === 'artifacts'} onClick={() => onChange('artifacts')}>
                <Icon icon="lucide:paperclip" width={12} height={12} />
                Artifacts
                {(run.screenshots_count > 0 || run.downloads_count > 0) && (
                    <> ({run.screenshots_count + run.downloads_count})</>
                )}
            </S.Tab>
        </S.Tabs>
    );
}
