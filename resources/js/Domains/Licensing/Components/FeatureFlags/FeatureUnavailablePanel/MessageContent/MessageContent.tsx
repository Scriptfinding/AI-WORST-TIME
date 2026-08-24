import MessageSegment from './MessageSegment';
import { parseMessageSegments } from '../utils';

interface Props {
    message: string;
}

export default function MessageContent({ message }: Props) {
    return parseMessageSegments(message).map((segment, index) => (
        <MessageSegment key={index} segment={segment} />
    ));
}
