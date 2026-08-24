import { Icon } from '@/Shared/UI/Icon/Icon';
import { useTheme } from 'styled-components';
import type { Visibility } from '@proprietary/Domains/Flow/Components/VisibilityPicker/types.pp';
import * as S from './styled.pp';

interface Props {
    value: Visibility;
    teamsEnabled: boolean;
    workspaceSharingEnabled: boolean;
    showDisabledFeatures: boolean;
    disabled?: boolean;
    onChange: (visibility: Visibility) => void;
}

interface VisibilityOption {
    value: Visibility;
    icon: string;
    color: string;
    title: string;
    description: string;
    enabled: boolean;
}

export default function VisibilitySelector({
    value,
    teamsEnabled,
    workspaceSharingEnabled,
    showDisabledFeatures,
    disabled,
    onChange,
}: Props) {
    const theme = useTheme();
    const options: VisibilityOption[] = [
        {
            value: 'owner',
            icon: 'lucide:user',
            color: theme.colors.accent.warning,
            title: 'Owner',
            description: 'Only the owner can see and run this flow.',
            enabled: true,
        },
        ...(teamsEnabled || showDisabledFeatures
            ? [{
                  value: 'team' as const,
                  icon: 'lucide:users',
                  color: theme.colors.accent.success,
                  title: 'Team',
                  description: 'Visible only to members of the selected team.',
                  enabled: teamsEnabled,
              }]
            : []),
        ...(workspaceSharingEnabled || showDisabledFeatures
            ? [{
                  value: 'workspace' as const,
                  icon: 'lucide:building-2',
                  color: theme.colors.accent.info,
                  title: 'Workspace',
                  description:
                      'Moved entirely to the workspace. No longer in your personal tree.',
                  enabled: workspaceSharingEnabled,
              }]
            : []),
    ];

    return (
        <S.Options>
            {options.map((option) => (
                <S.Option
                    key={option.value}
                    type="button"
                    $active={value === option.value}
                    $color={option.color}
                    $unavailable={!option.enabled}
                    onClick={() => onChange(option.value)}
                    disabled={disabled || !option.enabled}
                >
                    <S.OptionIcon $color={option.color} $unavailable={!option.enabled}>
                        <Icon icon={option.icon} width={16} />
                    </S.OptionIcon>
                    <S.OptionText>
                        <S.OptionTitle>{option.title}</S.OptionTitle>
                        <S.OptionDescription>
                            {option.description}
                        </S.OptionDescription>
                    </S.OptionText>
                </S.Option>
            ))}
        </S.Options>
    );
}
