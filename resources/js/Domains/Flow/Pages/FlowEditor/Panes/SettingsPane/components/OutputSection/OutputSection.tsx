import Switch from '@/Shared/UI/Switch/Switch';
import type { SettingsForm } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/types';
import * as S from './styled';

interface OutputSectionProps {
    form: SettingsForm;
    isNodalFlow: boolean;
}

export default function OutputSection({ form, isNodalFlow }: OutputSectionProps) {
    return (
        <>
            <S.SettingsSeparator />
            <S.SettingsSectionLabel>Output</S.SettingsSectionLabel>

            <Switch
                id="include_raw_output"
                checked={form.data.include_raw_output}
                onChange={value => form.setData('include_raw_output', value)}
                label="Include raw output"
            />
            <S.SettingsHint>
                {isNodalFlow
                    ? 'Append standard output to the run result.'
                    : 'Append stdout as $raw_output in the run result JSON.'}
            </S.SettingsHint>

            <Switch
                id="include_context_in_output"
                checked={form.data.include_context_in_output}
                onChange={value => form.setData('include_context_in_output', value)}
                label="Include context in output"
            />
            <S.SettingsHint>
                {isNodalFlow
                    ? 'Include run context such as metadata, legend and run ID in the output.'
                    : 'Include $context (meta, legend, run ID) in the run output.'}
            </S.SettingsHint>

            <Switch
                id="include_input_in_output"
                checked={form.data.include_input_in_output}
                onChange={value => form.setData('include_input_in_output', value)}
                label="Include input in output"
            />
            <S.SettingsHint>
                {isNodalFlow
                    ? 'Copy the run input into the output.'
                    : 'Copy the run input into the output under a $input key.'}
            </S.SettingsHint>

            <Switch
                id="always_success_response"
                checked={form.data.always_success_response}
                onChange={value => form.setData('always_success_response', value)}
                label="Always mark run as success"
            />
            <S.SettingsHint>
                {isNodalFlow
                    ? 'Mark the run as successful when the flow completes but its output reports a business error handled downstream.'
                    : 'When enabled, runs that use $generateResponseError will still be marked as "success". Useful when the flow itself ran correctly but the output signals a business error you handle downstream.'}
            </S.SettingsHint>
        </>
    );
}
