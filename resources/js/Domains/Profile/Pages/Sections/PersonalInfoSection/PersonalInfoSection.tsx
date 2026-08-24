import React, { useCallback } from 'react';
import { useForm, router } from '@inertiajs/react';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import IconPicker from '@/Shared/UI/IconPicker/IconPicker';
import type { User } from '@/App/types';
import TimezoneSelect from './components/TimezoneSelect/TimezoneSelect';
import * as S from './styled';

interface PersonalInfoSectionProps {
    user: User;
}

export default function PersonalInfoSection({ user }: PersonalInfoSectionProps) {
    const infoForm = useForm({
        name: user.name || '',
        email: user.email || '',
        timezone: user.timezone || 'UTC',
    });

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        infoForm.put('/profile');
    };

    const handleIconUpdate = useCallback((data: Record<string, string | null>, onDone?: () => void) => {
        router.put('/profile/icon', data, { preserveScroll: true, onFinish: onDone });
    }, []);

    const handleIconUpload = useCallback((file: File, onDone: () => void) => {
        router.post('/profile/avatar', { avatar: file }, {
            preserveScroll: true,
            forceFormData: true,
            onFinish: onDone,
        });
    }, []);

    const handleIconRemove = useCallback(() => {
        router.delete('/profile/avatar', { preserveScroll: true });
    }, []);

    const iconData = {
        icon_type: user.icon_type,
        icon_value: user.icon_value,
        icon_color: user.icon_color,
        icon_url: user.icon_url,
        name: user.name,
    };

    return (
        <>
            <S.Card>
                <S.CardTitle>Avatar</S.CardTitle>
                <IconPicker
                    data={iconData}
                    label="Profile avatar"
                    hint="Shown in sidebar and member lists"
                    iconRadius="full"
                    onUpdate={handleIconUpdate}
                    onUpload={handleIconUpload}
                    onRemove={handleIconRemove}
                />
            </S.Card>

            <S.Card>
                <S.CardTitle>Personal Information</S.CardTitle>
                <S.Form onSubmit={handleInfoSubmit}>
                    <Input
                        label="Full Name"
                        value={infoForm.data.name}
                        onChange={e => infoForm.setData('name', e.target.value)}
                        error={infoForm.errors.name}
                    />
                    <Input
                        label="Email"
                        type="email"
                        value={infoForm.data.email}
                        onChange={e => infoForm.setData('email', e.target.value)}
                        error={infoForm.errors.email}
                    />
                    <TimezoneSelect
                        value={infoForm.data.timezone}
                        error={infoForm.errors.timezone}
                        onChange={timezone => infoForm.setData('timezone', timezone)}
                    />
                    <div>
                        <Button type="submit" size="sm" disabled={infoForm.processing}>
                            Save Changes
                        </Button>
                    </div>
                </S.Form>
            </S.Card>
        </>
    );
}
