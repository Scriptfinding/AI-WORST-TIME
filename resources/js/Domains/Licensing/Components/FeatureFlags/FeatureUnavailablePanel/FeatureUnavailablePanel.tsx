import { usePage } from '@inertiajs/react';
import type { PageProps as InertiaPageProps } from '@inertiajs/core';
import type { PageProps } from '@/App/types';
import MessageContent from './MessageContent/MessageContent';
import * as S from './styled';

const DEFAULT_MESSAGE = 'This feature is not available on your instance.';

interface Props {
    message?: string;
}

export default function FeatureUnavailablePanel({ message }: Props) {
    const { settings } = usePage<InertiaPageProps & PageProps>().props;
    const resolvedMessage = message || settings.disabled_feature_message || DEFAULT_MESSAGE;

    return (
        <S.Wrapper>
            <S.Card>
                <S.Message>
                    <MessageContent message={resolvedMessage} />
                </S.Message>
            </S.Card>
        </S.Wrapper>
    );
}
