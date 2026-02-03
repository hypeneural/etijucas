import { useState, useRef, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Phone, Check, AlertCircle } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { formatPhone, validatePhone, cleanPhone } from '@/services/auth.service';

interface PhoneInputProps {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    autoFocus?: boolean;
}

export function PhoneInput({
    value,
    onChange,
    error,
    disabled = false,
    autoFocus = false,
}: PhoneInputProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [isFocused, setIsFocused] = useState(false);

    const cleanValue = cleanPhone(value);
    const isValid = validatePhone(cleanValue);
    const displayValue = formatPhone(value);

    useEffect(() => {
        if (autoFocus && inputRef.current) {
            inputRef.current.focus();
        }
    }, [autoFocus]);

    const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const clean = cleanPhone(raw);

        // Limit to 11 digits
        if (clean.length <= 11) {
            onChange(clean);
        }
    }, [onChange]);

    return (
        <div className="space-y-2">
            <label className="text-sm font-medium text-foreground/80 flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Número do WhatsApp
            </label>

            <div className="relative">
                <motion.div
                    animate={{
                        scale: isFocused ? 1.02 : 1,
                        borderColor: error
                            ? 'rgb(239, 68, 68)'
                            : isValid
                                ? 'rgb(34, 197, 94)'
                                : isFocused
                                    ? 'rgb(99, 102, 241)'
                                    : 'rgb(229, 231, 235)',
                    }}
                    transition={{ duration: 0.2 }}
                    className={cn(
                        'relative rounded-xl border-2 overflow-hidden',
                        'bg-background/50 backdrop-blur-sm'
                    )}
                >
                    <Input
                        ref={inputRef}
                        type="tel"
                        inputMode="numeric"
                        placeholder="(00) 00000-0000"
                        value={displayValue}
                        onChange={handleChange}
                        onFocus={() => setIsFocused(true)}
                        onBlur={() => setIsFocused(false)}
                        disabled={disabled}
                        className={cn(
                            'h-14 text-lg border-0 bg-transparent pl-4 pr-12',
                            'placeholder:text-muted-foreground/50',
                            'focus-visible:ring-0 focus-visible:ring-offset-0'
                        )}
                    />

                    {/* Status indicator */}
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                        {isValid && !error && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-1.5 rounded-full bg-green-100 dark:bg-green-900/30"
                            >
                                <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                            </motion.div>
                        )}
                        {error && (
                            <motion.div
                                initial={{ scale: 0 }}
                                animate={{ scale: 1 }}
                                className="p-1.5 rounded-full bg-red-100 dark:bg-red-900/30"
                            >
                                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                            </motion.div>
                        )}
                    </div>
                </motion.div>

                {/* Animated underline */}
                <motion.div
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: isFocused ? 1 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-primary to-primary/50 origin-left"
                />
            </div>

            {/* Error message */}
            {error && (
                <motion.p
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-sm text-red-500 dark:text-red-400 flex items-center gap-1"
                >
                    <AlertCircle className="h-3 w-3" />
                    {error}
                </motion.p>
            )}

            {/* Helper text */}
            {!error && cleanValue.length > 0 && !isValid && (
                <p className="text-xs text-muted-foreground">
                    Digite o DDD + 9 dígitos ({cleanValue.length}/11)
                </p>
            )}
        </div>
    );
}

export default PhoneInput;
