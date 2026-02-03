/**
 * Logger Utility
 * 
 * Centralized logging for errors, warnings, and debug info.
 * In production, this can be extended to send logs to external services.
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogContext {
    requestId?: string;
    userId?: string;
    component?: string;
    action?: string;
    [key: string]: unknown;
}

class Logger {
    private context: LogContext = {};

    setContext(ctx: LogContext) {
        this.context = { ...this.context, ...ctx };
    }

    clearContext() {
        this.context = {};
    }

    private log(level: LogLevel, message: string, data?: unknown) {
        const timestamp = new Date().toISOString();
        const logData = {
            timestamp,
            level,
            message,
            ...this.context,
            data,
        };

        // In development, use console
        if (import.meta.env.DEV) {
            const consoleMethod = level === 'error' ? console.error
                : level === 'warn' ? console.warn
                    : level === 'debug' ? console.debug
                        : console.log;

            consoleMethod(`[${level.toUpperCase()}]`, message, data || '');
            return;
        }

        // In production, could send to external service
        // Example: sendToLogService(logData);

        // For now, still log errors to console in production
        if (level === 'error') {
            console.error(logData);
        }
    }

    debug(message: string, data?: unknown) {
        if (import.meta.env.DEV) {
            this.log('debug', message, data);
        }
    }

    info(message: string, data?: unknown) {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown) {
        this.log('warn', message, data);
    }

    error(message: string, error?: Error | unknown) {
        this.log('error', message, {
            error: error instanceof Error ? {
                name: error.name,
                message: error.message,
                stack: error.stack,
            } : error,
        });
    }

    // Specific method for API errors
    apiError(endpoint: string, status: number, message: string, errors?: unknown) {
        this.error(`API Error: ${endpoint}`, {
            status,
            message,
            errors,
        });
    }

    // Specific method for offline sync errors
    syncError(action: string, error: unknown) {
        this.error(`Sync Error: ${action}`, error);
    }
}

export const logger = new Logger();
export default logger;
