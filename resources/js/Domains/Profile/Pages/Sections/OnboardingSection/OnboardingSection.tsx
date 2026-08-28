import { useState } from 'react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import axios from 'axios';
import { ONBOARDING_RESET_EVENT } from '@/App/Onboarding/pageOnboarding';
import { useToast } from '@/App/Hooks/useToast';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

export default function OnboardingSection() {
    const { toast } = useToast();
    const [resetting, setResetting] = useState(false);

    const resetOnboarding = async () => {
        setResetting(true);

        try {
            await axios.delete('/profile/onboarding');
            window.dispatchEvent(new Event(ONBOARDING_RESET_EVENT));
            toast('Onboarding messages reset');
        } catch {
            toast('Unable to reset onboarding messages', 'error');
        } finally {
            setResetting(false);
        }
    };

    return (
        <S.Card>
            <S.Visual aria-hidden="true">
                <Icon icon="lucide:life-buoy" width={24} height={24} />
            </S.Visual>
            <S.Content>
                <S.Title>Onboarding messages</S.Title>
                <S.Description>
                    Reset all page introductions and display them again as you browse Puppetflow.
                </S.Description>
            </S.Content>
            <Button variant="secondary" size="sm" loading={resetting} onClick={resetOnboarding}>
                <Icon icon="lucide:rotate-ccw" width={14} height={14} />
                Reset messages
            </Button>
        </S.Card>
    );
}
