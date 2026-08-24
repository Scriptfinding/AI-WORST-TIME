import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';

interface RunModalActionsProps {
    hasCodeSnapshot: boolean;
    onRun: (useOldCode: boolean) => void;
}

export default function RunModalActions({ hasCodeSnapshot, onRun }: RunModalActionsProps) {
    if (!hasCodeSnapshot) {
        return (
            <Button onClick={() => onRun(false)} autoFocus>
                <Icon icon="lucide:play" width={14} height={14} />
                Run
            </Button>
        );
    }

    return (
        <>
            <Button variant="secondary" onClick={() => onRun(true)}>
                <Icon icon="lucide:history" width={14} height={14} />
                Run with previous code
            </Button>
            <Button onClick={() => onRun(false)} autoFocus>
                <Icon icon="lucide:play" width={14} height={14} />
                Run with saved code
            </Button>
        </>
    );
}
