import { useCallback, useEffect, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Modal from '@/Shared/UI/Modal/Modal';
import { useDebouncedCallback } from '@/Shared/Hooks/useDebouncedCallback';
import { DEFAULT_COLOR, isCustomCoverColor, PRESET_COLORS } from '@/Domains/Flow/Pages/FlowEditor/Panes/WelcomePane/utils';
import * as S from './styled';

interface CoverColorPickerProps {
    isOpen: boolean;
    onClose: () => void;
    currentColor: string | null;
    onPick: (color: string | null, onDone?: () => void) => void;
}

export default function CoverColorPicker({ isOpen, onClose, currentColor, onPick }: CoverColorPickerProps) {
    const [saving, setSaving] = useState(false);
    const resolvedColor = currentColor || DEFAULT_COLOR;
    const isCustom = isCustomCoverColor(currentColor);
    const [customColor, setCustomColor] = useState(() => isCustom && currentColor ? currentColor : '#888888');

    const handlePick = useCallback((color: string | null) => {
        setSaving(true);
        onPick(color, () => setSaving(false));
    }, [onPick]);

    const debouncedPick = useDebouncedCallback(handlePick, 300);

    const handleCustomPick = useCallback((color: string) => {
        setCustomColor(color);
        debouncedPick(color);
    }, [debouncedPick]);

    const handleClose = useCallback(() => {
        debouncedPick.cancel();
        onClose();
    }, [debouncedPick, onClose]);

    useEffect(() => {
        if (!isOpen) debouncedPick.cancel();
    }, [debouncedPick, isOpen]);

    return (
        <Modal isOpen={isOpen} onClose={handleClose} title="Cover color" width="360px" transparentOverlay>
            <S.CoverColorPickerWrapper $busy={saving}>
                <S.CoverColorPreview $color={resolvedColor} />

                <S.CoverColorSectionLabel>Preset colors</S.CoverColorSectionLabel>
                <S.CoverColorGrid>
                    <S.CoverDefaultSwatch
                        $active={!currentColor}
                        onClick={() => handlePick(null)}
                        disabled={saving}
                        title="Default"
                    >
                        <svg viewBox="0 0 24 24" width={12} height={12} fill="none" stroke="currentColor" strokeWidth={2}>
                            <circle cx="12" cy="12" r="10" />
                        </svg>
                    </S.CoverDefaultSwatch>
                    {PRESET_COLORS.map(color => (
                        <S.CoverColorSwatch
                            key={color}
                            $color={color}
                            $active={currentColor === color}
                            onClick={() => handlePick(color)}
                            disabled={saving}
                        />
                    ))}
                    <S.CoverCustomColorLabel
                        $active={isCustom}
                        $disabled={saving}
                        title="Custom color"
                    >
                        <Icon icon="lucide:pipette" width={14} />
                        <input
                            type="color"
                            value={customColor}
                            onChange={event => handleCustomPick(event.target.value)}
                            disabled={saving}
                        />
                    </S.CoverCustomColorLabel>
                </S.CoverColorGrid>
            </S.CoverColorPickerWrapper>
        </Modal>
    );
}
