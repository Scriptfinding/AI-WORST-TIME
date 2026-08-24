import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './styled';

interface WelcomeToolbarProps {
    flowName: string;
    fileExtension: string;
    editorIcon: string;
    editorTitle: string;
    onSwitchToCode: () => void;
    sidePanelOpen?: boolean;
    onToggleSidePanel?: () => void;
}

export default function WelcomeToolbar({
    flowName,
    fileExtension,
    editorIcon,
    editorTitle,
    onSwitchToCode,
    sidePanelOpen,
    onToggleSidePanel,
}: WelcomeToolbarProps) {
    return (
        <S.Toolbar>
            <S.ViewToggle>
                <S.ViewToggleTab $active title="Welcome">
                    <Icon icon="lucide:book-open" width={13} height={13} />
                </S.ViewToggleTab>
                <S.ViewToggleTab $active={false} onClick={onSwitchToCode} title={editorTitle}>
                    <Icon icon={editorIcon} width={13} height={13} />
                </S.ViewToggleTab>
            </S.ViewToggle>
            <S.ToolbarLabel>{flowName}.{fileExtension}</S.ToolbarLabel>
            {onToggleSidePanel && (
                <S.SidePanelToggle
                    $active={sidePanelOpen}
                    onClick={onToggleSidePanel}
                    title={sidePanelOpen ? 'Hide side panel' : 'Show side panel'}
                >
                    <Icon
                        icon={sidePanelOpen ? 'lucide:panel-right-close' : 'lucide:panel-right-open'}
                        width={13}
                        height={13}
                    />
                </S.SidePanelToggle>
            )}
        </S.Toolbar>
    );
}
