/**
 * UI-only enums that don't come from the API
 */

/** Loading states for async operations */
export enum LoadingState {
    Idle = 'idle',
    Loading = 'loading',
    Success = 'success',
    Error = 'error',
}

/** Form submission states */
export enum FormState {
    Initial = 'initial',
    Submitting = 'submitting',
    Submitted = 'submitted',
    Error = 'error',
}

/** Modal sizes */
export enum ModalSize {
    Small = 'sm',
    Medium = 'md',
    Large = 'lg',
    FullScreen = 'full',
}
