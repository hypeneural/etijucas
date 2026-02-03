/**
 * Auth Utilities
 * Standardized password validation and error mapping for Laravel API
 */

// Simplified: Only 8+ characters required
export const PASSWORD_REGEX = /^.{8,}$/;

export const PASSWORD_REQUIREMENTS = [
    { label: 'Mínimo de 8 caracteres', test: (p: string) => p.length >= 8 },
];

/**
 * Maps Laravel API validation keys to friendly Portuguese messages
 */
export function mapAuthError(error: any): string {
    // If it's a specific validation error with a "code" or "message" key
    const message = error.data?.message || error.message;
    const errors = error.data?.errors || {};

    // 1. Check for specific password errors first
    if (errors.password) {
        const passwordError = errors.password[0]; // Get first error

        switch (passwordError) {
            case 'validation.password.uncompromised':
                return 'Por segurança, essa senha não pode ser usada pois já apareceu em vazamentos de dados na internet. Escolha uma senha única.';
            case 'validation.password.mixed':
                return 'A senha deve conter letras maiúsculas e minúsculas.';
            case 'validation.password.numbers':
                return 'A senha deve conter pelo menos um número.';
            case 'validation.min.string':
                return 'A senha deve ter pelo menos 8 caracteres.';
            case 'validation.confirmed':
                return 'A confirmação de senha não confere.';
        }
    }

    // 2. Check for generic error codes
    switch (error.data?.code) {
        case 'RATE_LIMITED':
            return `Muitas tentativas. Tente novamente em ${error.data.retryAfter || 'alguns'} segundos.`;
        case 'INVALID_CREDENTIALS':
            return 'Telefone ou senha incorretos.';
        case 'USER_NOT_FOUND':
            return 'Usuário não encontrado.';
        case 'INVALID_OTP':
            return 'Código de verificação inválido.';
        case 'OTP_EXPIRED':
            return 'O código expirou. Solicite um novo.';
        case 'OTP_NOT_VERIFIED':
            return 'Verifique o telefone antes de continuar.';
    }

    // 3. Fallback to raw message or default
    if (message === 'validation.password.uncompromised') {
        return 'Por segurança, essa senha não pode ser usada pois já apareceu em vazamentos de dados na internet. Escolha uma senha única.';
    }

    return message || 'Ocorreu um erro inesperado. Tente novamente.';
}
