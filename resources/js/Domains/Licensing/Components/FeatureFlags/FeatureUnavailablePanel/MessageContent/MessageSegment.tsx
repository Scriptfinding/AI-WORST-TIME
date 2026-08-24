import ReactMarkdown, { type Components } from 'react-markdown';
import type { MessageSegment as MessageSegmentValue } from '../utils';
import * as S from './styled';

const markdownComponents: Components = {
    p: ({ children }) => <>{children}</>,
    a: ({ children, href, ...props }) => (
        <a href={href} target="_blank" rel="noopener noreferrer" {...props}>
            {children}
        </a>
    ),
    img: ({ alt, ...props }) => (
        <img alt={alt ?? ''} loading="lazy" {...props} />
    ),
};

interface Props {
    segment: MessageSegmentValue;
}

export default function MessageSegment({ segment }: Props) {
    return segment.underline ? (
        <S.Underline>{segment.text}</S.Underline>
    ) : (
        <ReactMarkdown components={markdownComponents}>
            {segment.text}
        </ReactMarkdown>
    );
}
