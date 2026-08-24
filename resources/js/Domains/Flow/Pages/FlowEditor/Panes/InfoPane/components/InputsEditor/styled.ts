import styled from 'styled-components';
import { SettingsHint } from '@/Domains/Flow/Pages/FlowEditor/shared/forms.styled';

export const InputsHint = styled(SettingsHint)`
    margin-top: -6px;
    margin-bottom: 8px;
`;

export const Actions = styled.div`
    margin-top: 8px;
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 8px;
`;

export const DirtyHint = styled(SettingsHint)`
    margin-top: 0;
    color: var(--accent-warning, #f59e0b);
`;
