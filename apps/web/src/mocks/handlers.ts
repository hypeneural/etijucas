import { manualHandlers } from './handlers.manual';
import { generatedHandlers } from './handlers.generated';

// Manual handlers go first so they override generated defaults.
export const handlers = [...manualHandlers, ...generatedHandlers];
