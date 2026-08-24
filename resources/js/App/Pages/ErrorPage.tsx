import AppLayout from '@/App/Layout/AppLayout/AppLayout';
import { Icon } from '@/Shared/UI/Icon/Icon';
import * as S from './ErrorPage.styled';

interface ErrorPageProps {
    status: number;
}

const errors: Record<number, { title: string; description: string }> = {
    403: {
        title: 'Access denied',
        description: 'You do not have permission to access this page.',
    },
    404: {
        title: 'Page not found',
        description: 'The page you are looking for may have been moved, deleted, or never existed.',
    },
    500: {
        title: 'Something went wrong',
        description: 'An unexpected error occurred. Please try again in a moment.',
    },
    503: {
        title: 'Service unavailable',
        description: 'Puppetflow is temporarily unavailable. Please try again shortly.',
    },
};

export default function ErrorPage({ status }: ErrorPageProps) {
    const error = errors[status] ?? errors[500];

    return (
        <AppLayout>
            <S.Container>
                <S.Content>
                    <S.Status><S.StatusLabel>Error</S.StatusLabel> {status}</S.Status>
                    <S.Title>{error.title}</S.Title>
                    <S.Description>{error.description}</S.Description>
                    <S.Action href="/">
                        <Icon icon="lucide:home" aria-hidden="true" />
                        Back to dashboard
                    </S.Action>
                </S.Content>
            </S.Container>
        </AppLayout>
    );
}
