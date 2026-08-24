import { forwardRef, useEffect, type ReactNode } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import type { NestedLevel } from '../utils';
import * as S from './styled';

interface NestedFieldsPanelProps {
    path: NestedLevel[];
    rect: {
        top: number;
        left: number;
        width: number;
        maxHeight: number;
        placement: 'above' | 'below';
    };
    children: ReactNode;
    onNavigate: (index: number) => void;
    onClose: () => void;
}

const NestedFieldsPanel = forwardRef<HTMLDivElement, NestedFieldsPanelProps>(function NestedFieldsPanel({
    path,
    rect,
    children,
    onNavigate,
    onClose,
}, ref) {
    const activeLevel = path[path.length - 1];

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key !== 'Escape') return;
            event.preventDefault();
            onClose();
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <S.Panel
            ref={ref}
            data-structured-input-nested-panel
            $top={rect.top}
            $left={rect.left}
            $width={rect.width}
            $maxHeight={rect.maxHeight}
            $placement={rect.placement}
            role="dialog"
            aria-label={`Edit ${activeLevel?.type} value`}
        >
            <S.Header>
                <S.Breadcrumbs>
                    {path.map((level, index) => (
                        <span key={`${level.index}-${index}`}>
                            {index > 0 && <Icon icon="lucide:chevron-right" width={12} height={12} />}
                            <button
                                type="button"
                                aria-current={index === path.length - 1 ? 'page' : undefined}
                                onClick={() => onNavigate(index)}
                            >
                                {level.label}
                            </button>
                        </span>
                    ))}
                    <S.Type>{activeLevel?.type}</S.Type>
                </S.Breadcrumbs>
                <S.CloseButton type="button" onClick={onClose} aria-label="Close nested editor">
                    <Icon icon="lucide:x" width={14} height={14} />
                </S.CloseButton>
            </S.Header>
            <S.Body>{children}</S.Body>
        </S.Panel>
    );
});

export default NestedFieldsPanel;
