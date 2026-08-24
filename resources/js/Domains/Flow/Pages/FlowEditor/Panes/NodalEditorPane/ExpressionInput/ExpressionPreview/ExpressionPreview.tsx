import { Fragment } from 'react';
import { unresolvedResultLabel } from '../utils';
import UnresolvedBadge from './UnresolvedBadge/UnresolvedBadge';
import * as S from './styled';

interface ExpressionPreviewProps {
    value: unknown;
}

export default function ExpressionPreview({ value }: ExpressionPreviewProps) {
    const unresolvedLabel = unresolvedResultLabel(value);

    if (unresolvedLabel) {
        return <UnresolvedBadge label={unresolvedLabel} />;
    }

    if (typeof value === 'string') {
        const parts = [...value.matchAll(/\[Needs run: ([^\]]+)\]/g)];

        if (parts.length > 0) {
            let offset = 0;

            return (
                <S.ExpressionMixedPreview>
                    {parts.map((match, index) => {
                        const before = value.slice(offset, match.index);
                        offset = (match.index ?? 0) + match[0].length;

                        return (
                            <Fragment key={`${match[0]}-${index}`}>
                                {before}
                                <UnresolvedBadge label={match[1]} />
                                {index === parts.length - 1 ? value.slice(offset) : null}
                            </Fragment>
                        );
                    })}
                </S.ExpressionMixedPreview>
            );
        }
    }

    return (
        <pre>
            {typeof value === 'string'
                ? value
                : JSON.stringify(value, null, 2)}
        </pre>
    );
}
