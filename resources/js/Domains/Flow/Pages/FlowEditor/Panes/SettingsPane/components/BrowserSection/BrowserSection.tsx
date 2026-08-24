import Input from '@/Shared/UI/Input/Input';
import Switch from '@/Shared/UI/Switch/Switch';
import type { SettingsForm } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/types';
import type { SettingsLimits } from '@/Domains/Flow/Pages/FlowEditor/Panes/SettingsPane/useSettingsLimits';
import * as S from './styled';

interface BrowserSectionProps {
    form: SettingsForm;
    viewport: SettingsLimits['wsViewport'];
    keyboardSpeed: SettingsLimits['wsKeyboardSpeed'];
}

export default function BrowserSection({ form, viewport, keyboardSpeed }: BrowserSectionProps) {
    return (
        <>
            <S.SettingsSeparator />
            <S.SettingsSectionLabel>Browser</S.SettingsSectionLabel>

            <S.ViewportRow>
                <Input
                    label="Viewport width"
                    type="number"
                    placeholder={String(viewport.width)}
                    value={form.data.viewport_width === '' ? '' : String(form.data.viewport_width)}
                    onChange={e => form.setData('viewport_width', e.target.value === '' ? '' : Number(e.target.value))}
                    error={form.errors.viewport_width}
                />
                <S.ViewportSep>x</S.ViewportSep>
                <Input
                    label="Viewport height"
                    type="number"
                    placeholder={String(viewport.height)}
                    value={form.data.viewport_height === '' ? '' : String(form.data.viewport_height)}
                    onChange={e => form.setData('viewport_height', e.target.value === '' ? '' : Number(e.target.value))}
                    error={form.errors.viewport_height}
                />
            </S.ViewportRow>
            <S.SettingsHint>
                Override browser viewport for this flow. Leave empty to use workspace default ({viewport.width}x{viewport.height}).
            </S.SettingsHint>

            <Input
                label="Keyboard speed"
                type="number"
                placeholder={String(keyboardSpeed)}
                value={form.data.keyboard_speed === '' ? '' : String(form.data.keyboard_speed)}
                onChange={e => form.setData('keyboard_speed', e.target.value === '' ? '' : Number(e.target.value))}
                error={form.errors.keyboard_speed}
            />
            <S.SettingsHint>
                Override the delay between keystrokes for this flow. Leave empty to use workspace default ({keyboardSpeed} ms).
            </S.SettingsHint>

            <Switch
                id="disable_web_security"
                checked={form.data.disable_web_security}
                onChange={value => form.setData('disable_web_security', value)}
                label="Disable web security"
            />
            <S.SettingsHint>Launch the browser with --disable-web-security (allows cross-origin requests).</S.SettingsHint>
        </>
    );
}
