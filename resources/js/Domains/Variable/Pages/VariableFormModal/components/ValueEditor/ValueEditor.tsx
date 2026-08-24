import Input from '@/Shared/UI/Input/Input';
import type { VariableType } from '@/Domains/Variable/Pages/VariableFormModal/types';
import StructuredValueEditor from './StructuredValueEditor';

interface ValueEditorProps {
    type: VariableType;
    value: string;
    error?: string;
    onChange: (value: string) => void;
}

export default function ValueEditor({ type, value, error, onChange }: ValueEditorProps) {
    if (type === 'object' || type === 'array') {
        return <StructuredValueEditor type={type} value={value} onChange={onChange} error={error} />;
    }

    if (type === 'otp') {
        return (
            <Input
                label="TOTP Seed (base32)"
                value={value}
                onChange={event => onChange(event.target.value)}
                error={error}
                placeholder="JBSWY3DPEHPK3PXP"
                type="password"
            />
        );
    }

    if (type === 'text' || type === 'secret') {
        return (
            <Input
                label="Value"
                value={value}
                onChange={event => onChange(event.target.value)}
                error={error}
                placeholder={type === 'secret' ? '••••••••' : 'my_value'}
                type={type === 'secret' ? 'password' : 'text'}
            />
        );
    }

    return null;
}
