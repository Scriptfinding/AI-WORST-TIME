import ChangePasswordCard from './SecuritySection/components/ChangePasswordCard/ChangePasswordCard';
import TwoFactorCard from './SecuritySection/components/TwoFactorCard/TwoFactorCard';

interface SecuritySectionProps {
    twoFactorEnabled: boolean;
}

export default function SecuritySection({ twoFactorEnabled }: SecuritySectionProps) {
    return (
        <>
            <TwoFactorCard twoFactorEnabled={twoFactorEnabled} />
            <ChangePasswordCard />
        </>
    );
}
