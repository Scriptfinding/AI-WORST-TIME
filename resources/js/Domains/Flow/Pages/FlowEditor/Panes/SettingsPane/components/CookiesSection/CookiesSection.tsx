import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import * as S from './styled';

interface CookiesSectionProps {
    onClear: () => Promise<void>;
}

export default function CookiesSection({ onClear }: CookiesSectionProps) {
    return (
        <S.InfoBanner>
            <S.InfoBannerTitle>
                <Icon icon="lucide:cookie" width={13} height={13} />
                Saved Cookies
            </S.InfoBannerTitle>
            <S.InfoBannerDescription>
                Clear all cookies saved by this flow (login sessions, etc.). Running flows will use fresh browser sessions.
            </S.InfoBannerDescription>
            <Button variant="secondary" size="sm" onClick={onClear}>
                <Icon icon="lucide:trash-2" width={13} height={13} />
                Clear Cookies
            </Button>
        </S.InfoBanner>
    );
}
