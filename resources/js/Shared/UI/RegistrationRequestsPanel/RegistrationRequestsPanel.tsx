import { Icon } from '@/Shared/UI/Icon/Icon';
import Button from '@/Shared/UI/Button/Button';
import { formatDate } from '@/Domains/Workspace/Pages/WorkspaceMembers/utils';
import * as S from './styled';

export interface RegistrationRequestItem {
    id: number;
    name: string;
    email: string;
    email_verified_at: string | null;
    origin: 'password' | 'email' | 'sso';
    created_at: string;
}

interface Props<T extends RegistrationRequestItem> {
    requests: T[];
    onReject: (request: T) => void;
    onReview: (request: T) => void;
}

const originLabels: Record<RegistrationRequestItem['origin'], string> = {
    password: 'Password',
    email: 'Email',
    sso: 'SSO',
};

export default function RegistrationRequestsPanel<T extends RegistrationRequestItem>({
    requests,
    onReject,
    onReview,
}: Props<T>) {
    if (requests.length === 0) return null;

    return (
        <S.Panel>
            <S.Header>
                <S.Title>
                    <Icon icon="lucide:inbox" width={15} height={15} />
                    Invitation requests
                </S.Title>
                <S.Count>{requests.length}</S.Count>
            </S.Header>
            <S.List>
                {requests.map(request => (
                    <S.Row key={request.id}>
                        <S.Identity>
                            <S.Name>{request.name}</S.Name>
                            <S.Email>{request.email}</S.Email>
                        </S.Identity>
                        <S.Status $verified={Boolean(request.email_verified_at)}>
                            {originLabels[request.origin]},
                            {request.email_verified_at && (
                                <>
                                    <Icon icon="lucide:badge-check" width={12} height={12} />
                                    Email verified,
                                </>
                            )}
                            {formatDate(request.created_at)}
                        </S.Status>
                        <S.Actions>
                            <Button size="sm" variant="ghost" onClick={() => onReject(request)}>
                                Reject
                            </Button>
                            <Button size="sm" onClick={() => onReview(request)}>
                                Review
                            </Button>
                        </S.Actions>
                    </S.Row>
                ))}
            </S.List>
        </S.Panel>
    );
}
