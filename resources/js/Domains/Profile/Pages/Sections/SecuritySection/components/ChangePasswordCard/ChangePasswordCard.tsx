import React from 'react';
import { useForm } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import * as S from './styled';

export default function ChangePasswordCard() {
    const passwordForm = useForm({
        current_password: '',
        password: '',
        password_confirmation: '',
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        passwordForm.put('/profile/password', {
            onSuccess: () => {
                passwordForm.reset();
            },
        });
    };

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:lock" width={15} height={15} />
                Change Password
            </S.CardTitle>
            <S.Form onSubmit={handleSubmit}>
                <Input
                    label="Current Password"
                    type="password"
                    value={passwordForm.data.current_password}
                    onChange={e => passwordForm.setData('current_password', e.target.value)}
                    error={passwordForm.errors.current_password}
                />
                <S.Separator />
                <Input
                    label="New Password"
                    type="password"
                    value={passwordForm.data.password}
                    onChange={e => passwordForm.setData('password', e.target.value)}
                    error={passwordForm.errors.password}
                />
                <Input
                    label="Confirm New Password"
                    type="password"
                    value={passwordForm.data.password_confirmation}
                    onChange={e => passwordForm.setData('password_confirmation', e.target.value)}
                    error={passwordForm.errors.password_confirmation}
                />
                <S.PasswordHint>Minimum 8 characters.</S.PasswordHint>
                <div>
                    <Button type="submit" size="sm" disabled={passwordForm.processing}>
                        Change Password
                    </Button>
                </div>
            </S.Form>
        </S.Card>
    );
}
