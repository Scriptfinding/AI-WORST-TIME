import { useEffect, useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './GrabberOnboarding.styled';

interface GrabberOnboardingProps {
    chromeStoreUrl: string;
    firefoxStoreUrl: string;
    onClose: () => void;
    onStart: () => void;
    onDismissFuture: () => void;
}

export default function GrabberOnboarding({
    chromeStoreUrl,
    firefoxStoreUrl,
    onClose,
    onStart,
    onDismissFuture,
}: GrabberOnboardingProps) {
    const [saved, setSaved] = useState(false);

    useEffect(() => {
        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    return (
        <S.Backdrop onMouseDown={onClose}>
            <S.Card
                role="dialog"
                aria-modal="true"
                aria-labelledby="grabber-onboarding-title"
                onMouseDown={event => event.stopPropagation()}
            >
                <S.Close type="button" aria-label="Close" onClick={onClose}>
                    <Icon icon="lucide:x" width={15} height={15} />
                </S.Close>
                <S.Brand>
                    <S.BrandMark>
                        <Icon icon="lucide:mouse-pointer-2" width={14} height={14} />
                    </S.BrandMark>
                    <span>Puppetflow Grabber</span>
                </S.Brand>
                <S.StoreBanners>
                    <S.StoreBanner
                        href={chromeStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Icon icon="logos:chrome" width={17} height={17} />
                        <span><small>Chrome extension</small>Get the Grabber</span>
                        <Icon icon="lucide:arrow-up-right" width={15} height={15} />
                    </S.StoreBanner>
                    <S.StoreBanner
                        href={firefoxStoreUrl}
                        target="_blank"
                        rel="noreferrer"
                    >
                        <Icon icon="logos:firefox" width={17} height={17} />
                        <span><small>Firefox extension</small>Get the Grabber</span>
                        <Icon icon="lucide:arrow-up-right" width={15} height={15} />
                    </S.StoreBanner>
                </S.StoreBanners>
                <S.Title id="grabber-onboarding-title">Pick it from the page</S.Title>
                <S.Intro>
                    Open the page, click what you need, and the selector will land right here.
                </S.Intro>
                <S.PickerHint>
                    <S.HintIcon><Icon icon="lucide:crosshair" width={16} height={16} /></S.HintIcon>
                    <span>
                        <strong>Your page opens in picking mode</strong>
                        Hover to preview. Click once to grab.
                    </span>
                    <kbd>Esc</kbd>
                </S.PickerHint>
                <S.Actions>
                    <S.DismissFuture
                        type="button"
                        $saved={saved}
                        onClick={() => {
                            onDismissFuture();
                            setSaved(true);
                        }}
                    >
                        <Icon icon={saved ? 'lucide:check' : 'lucide:eye-off'} width={13} height={13} />
                        {saved ? 'Got it' : "Don't show this again"}
                    </S.DismissFuture>
                    <S.StartButton type="button" onClick={onStart}>
                        <Icon icon="lucide:crosshair" width={14} height={14} />
                        Pick an element
                    </S.StartButton>
                </S.Actions>
            </S.Card>
        </S.Backdrop>
    );
}
