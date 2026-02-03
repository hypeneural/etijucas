/**
 * Core UI Components
 * 
 * Design system base compartilhado entre features.
 * Re-exports dos componentes em components/ui/
 */

// Re-export all UI components
export * from '../../components/ui/button';
export * from '../../components/ui/card';
export * from '../../components/ui/dialog';
export * from '../../components/ui/input';
export * from '../../components/ui/label';
export * from '../../components/ui/badge';
export * from '../../components/ui/skeleton';
export * from '../../components/ui/toast';
export * from '../../components/ui/ErrorBoundary';

// Re-export common utilities
export { cn } from '../../lib/utils';
