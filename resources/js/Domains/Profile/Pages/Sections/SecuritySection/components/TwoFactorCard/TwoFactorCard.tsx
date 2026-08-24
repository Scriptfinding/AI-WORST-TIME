import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import Input from '@/Shared/UI/Input/Input';
import * as S from './styled';

interface TwoFactorCardProps {
    twoFactorEnabled: boolean;
}

export default function TwoFactorCard({ twoFactorEnabled }: TwoFactorCardProps) {
    const [showDisable, setShowDisable] = useState(false);
    const disableForm = useForm({ password: '' });

    const handleDisable = (e: React.FormEvent) => {
        e.preventDefault();
        disableForm.delete('/two-factor/disable', {
            onSuccess: () => {
                setShowDisable(false);
                disableForm.reset();
            },
        });
    };

    return (
        <S.Card>
            <S.CardTitle>
                <Icon icon="lucide:shield" width={15} height={15} />
                Two-Factor Authentication
            </S.CardTitle>

            {twoFactorEnabled ? (
                <>
                    <S.Status>
                        <S.Badge $enabled>
                            <Icon icon="lucide:check-circle" width={14} height={14} />
                            Enabled
                        </S.Badge>
                        <S.Hint>
                            Your account is protected with an authenticator app.
                        </S.Hint>
                    </S.Status>

                    {!showDisable ? (
                        <div>
                            <Button
                                variant="danger"
                                size="sm"
                                onClick={() => {
                                    setShowDisable(true);
                                    disableForm.reset();
                                }}
                            >
                                Disable 2FA
                            </Button>
                        </div>
                    ) : (
                        <S.Form onSubmit={handleDisable}>
                            <Input
                                label="Confirm your password"
                                type="password"
                                value={disableForm.data.password}
                                onChange={e => disableForm.setData('password', e.target.value)}
                                error={disableForm.errors.password}
                                placeholder="Your password"
                                autoFocus
                            />
                            <S.Actions>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={() => setShowDisable(false)}
                                >
                                    Cancel
                                </Button>
                                <Button
                                    variant="danger"
                                    size="sm"
                                    type="submit"
                                    disabled={disableForm.processing || !disableForm.data.password}
                                >
                                    Confirm Disable
                                </Button>
                            </S.Actions>
                        </S.Form>
                    )}
                </>
            ) : (
                <>
                    <S.Status>
                        <S.Badge $enabled={false}>
                            <Icon icon="lucide:shield-off" width={14} height={14} />
                            Not enabled
                        </S.Badge>
                        <S.Hint>
                            Add an extra layer of security to your account using a TOTP authenticator app.
                        </S.Hint>
                    </S.Status>

                    <div>
                        <Button
                            size="sm"
                            onClick={() => router.visit('/two-factor/setup')}
                        >
                            <Icon icon="lucide:shield-plus" width={14} height={14} />
                            Enable 2FA
                        </Button>
                    </div>
                </>
            )}
        </S.Card>
    );
}
