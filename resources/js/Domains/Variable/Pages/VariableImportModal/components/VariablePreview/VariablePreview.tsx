import type { ParsedImport } from '@/Domains/Variable/Pages/VariableImportModal/utils';
import * as S from './styled';

interface VariablePreviewProps {
    parsed: ParsedImport;
    fieldErrors: Record<string, string>;
}

export default function VariablePreview({ parsed, fieldErrors }: VariablePreviewProps) {
    const validCount = parsed.variables.filter(variable => !variable.error).length;
    const secretCount = parsed.variables.filter(variable => variable.type === 'secret').length;

    return (
        <S.Preview>
            <S.Header>
                <span>{validCount} variable{validCount > 1 ? 's' : ''} detected ({parsed.format})</span>
                <span>{secretCount} secret{secretCount > 1 ? 's' : ''}</span>
            </S.Header>
            <S.List>
                {parsed.variables.map((variable, index) => {
                    const backendError = fieldErrors[`variables.${index}.key`] || fieldErrors[`variables.${index}.value`];
                    const error = variable.error || backendError;

                    return (
                        <S.Row key={`${variable.sourceKey}-${index}`} $error={!!error}>
                            <S.Key>{variable.key || '(empty key)'}</S.Key>
                            <S.TypeBadge
                                $secret={variable.type === 'secret'}
                                $json={variable.type === 'object' || variable.type === 'array'}
                            >
                                {variable.type}
                            </S.TypeBadge>
                            <S.Value>{variable.type === 'secret' ? '••••••••' : variable.value}</S.Value>
                            {error && <S.Error>{error}</S.Error>}
                        </S.Row>
                    );
                })}
            </S.List>
        </S.Preview>
    );
}
