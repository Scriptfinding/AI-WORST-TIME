import { useEffect, useMemo, useState } from 'react';
import type { MailboxEmail } from '@/Domains/Mailbox/types';
import { formatEmailDate, formatEmailSize } from '@/Domains/Mailbox/Pages/EmailPreviewPanel/utils';
import * as S from './styled';

interface Props {
    email: MailboxEmail;
}

const isolatedEmailDocument = (html: string, allowRemoteImages: boolean) => `<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta http-equiv="Content-Security-Policy" content="default-src 'none'; img-src data: cid:${allowRemoteImages ? ' https: http:' : ''}; style-src 'unsafe-inline'; font-src data:">
<meta name="referrer" content="no-referrer">
<style>html,body{margin:0;padding:0;color:#111;background:#fff;font:13px/1.6 sans-serif}img{max-width:100%;height:auto}</style>
</head>
<body>${html}</body>
</html>`;

export default function EmailPreviewBody({ email }: Props) {
    const [allowRemoteImages, setAllowRemoteImages] = useState(false);
    const hasRemoteImages = useMemo(
        () => /(?:src\s*=\s*["']?\s*(?:https?:)?\/\/|url\(\s*["']?\s*(?:https?:)?\/\/)/i.test(email.html_body ?? ''),
        [email.html_body],
    );

    useEffect(() => {
        setAllowRemoteImages(false);
    }, [email.id]);

    return (
        <S.PreviewContent>
            <S.PreviewSubject>{email.subject || '(No subject)'}</S.PreviewSubject>
            <S.PreviewMeta>
                <S.MetaRow>
                    <S.MetaLabel>From</S.MetaLabel>
                    <S.MetaValue>{email.from_address}</S.MetaValue>
                </S.MetaRow>
                <S.MetaRow>
                    <S.MetaLabel>To</S.MetaLabel>
                    <S.MetaValue>{email.to_address}</S.MetaValue>
                </S.MetaRow>
                <S.MetaRow>
                    <S.MetaLabel>Date</S.MetaLabel>
                    <S.MetaValue>{formatEmailDate(email.date || email.received_at)}</S.MetaValue>
                </S.MetaRow>
                <S.MetaRow>
                    <S.MetaLabel>Size</S.MetaLabel>
                    <S.MetaValue>{formatEmailSize(email.raw_size)}</S.MetaValue>
                </S.MetaRow>
            </S.PreviewMeta>
            {email.html_body ? (
                <>
                    {hasRemoteImages && (
                        <S.RemoteImagesNotice>
                            <S.RemoteImagesText>
                                Remote images are blocked to protect your privacy.
                            </S.RemoteImagesText>
                            <S.RemoteImagesButton
                                type="button"
                                onClick={() => setAllowRemoteImages(current => !current)}
                            >
                                {allowRemoteImages ? 'Block images' : 'Display images'}
                            </S.RemoteImagesButton>
                        </S.RemoteImagesNotice>
                    )}
                    <S.PreviewFrame
                        sandbox=""
                        referrerPolicy="no-referrer"
                        srcDoc={isolatedEmailDocument(email.html_body, allowRemoteImages)}
                        title="Email content"
                    />
                </>
            ) : (
                <S.TextBody>{email.text_body || '(No content)'}</S.TextBody>
            )}
        </S.PreviewContent>
    );
}
