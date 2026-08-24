import 'styled-components';
import type { Theme } from './Utils/theme';

declare module 'styled-components' {
    export interface DefaultTheme extends Theme {}
}
