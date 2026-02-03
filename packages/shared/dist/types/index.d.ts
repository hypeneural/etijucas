/**
 * UI-only types that don't come from the API
 */
/** Theme configuration for the application */
export interface ThemeConfig {
    mode: 'light' | 'dark' | 'system';
    primaryColor?: string;
}
/** Navigation item for menus */
export interface NavItem {
    label: string;
    href: string;
    icon?: string;
    badge?: string | number;
    children?: NavItem[];
}
/** Toast notification configuration */
export interface ToastConfig {
    title: string;
    description?: string;
    variant?: 'default' | 'success' | 'error' | 'warning';
    duration?: number;
}
//# sourceMappingURL=index.d.ts.map