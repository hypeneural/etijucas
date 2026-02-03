import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Check, AlertCircle, Home, Building2 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { viacepService, formatCEP, cleanCEP, validateCEP } from '@/services/viacep.service';
import type { ViaCEPResponse, Address } from '@/types/auth.types';

interface AddressAutocompleteProps {
    value: Partial<Address>;
    onChange: (address: Partial<Address>) => void;
    error?: string;
    disabled?: boolean;
}

export function AddressAutocomplete({
    value,
    onChange,
    error,
    disabled = false,
}: AddressAutocompleteProps) {
    const [cepInput, setCepInput] = useState(value.cep || '');
    const [isLoading, setIsLoading] = useState(false);
    const [cepError, setCepError] = useState<string | null>(null);
    const [cepSuccess, setCepSuccess] = useState(false);

    // Handle CEP input change
    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const clean = cleanCEP(raw);

        if (clean.length <= 8) {
            setCepInput(formatCEP(clean));
            setCepError(null);
            setCepSuccess(false);

            // Update only CEP in parent
            onChange({ ...value, cep: clean });
        }
    }, [onChange, value]);

    // Auto-fetch when CEP is complete
    useEffect(() => {
        const clean = cleanCEP(cepInput);

        if (clean.length === 8 && validateCEP(clean)) {
            const fetchAddress = async () => {
                setIsLoading(true);
                setCepError(null);
                setCepSuccess(false);

                try {
                    const data: ViaCEPResponse = await viacepService.fetchByCEP(clean);

                    // Validate: Only Tijucas allowed
                    if (data.localidade?.toLowerCase() !== 'tijucas') {
                        setCepError('Somente moradores de Tijucas podem se cadastrar. Este CEP é de ' + data.localidade + '.');
                        onChange({ cep: clean });
                        return;
                    }

                    // Update address with ViaCEP data (city/state fixed to Tijucas/SC)
                    onChange({
                        cep: clean,
                        logradouro: data.logradouro,
                        bairro: data.bairro,
                        localidade: 'Tijucas',  // Always Tijucas
                        uf: 'SC',               // Always SC
                        complemento: data.complemento || undefined,
                    });

                    setCepSuccess(true);
                } catch (err) {
                    setCepError(err instanceof Error ? err.message : 'Erro ao buscar CEP');
                    // Clear address fields on error
                    onChange({ cep: clean });
                } finally {
                    setIsLoading(false);
                }
            };

            fetchAddress();
        }
    }, [cepInput]);

    // Update field handler
    const updateField = useCallback((field: keyof Address, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    }, [onChange, value]);

    return (
        <div className="space-y-4">
            {/* CEP Input */}
            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    CEP
                </Label>

                <div className="relative">
                    <Input
                        type="text"
                        inputMode="numeric"
                        placeholder="00000-000"
                        value={cepInput}
                        onChange={handleCepChange}
                        disabled={disabled || isLoading}
                        className={cn(
                            'h-12 text-base pr-12',
                            cepError && 'border-red-400',
                            cepSuccess && 'border-green-400'
                        )}
                    />

                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        <AnimatePresence mode="wait">
                            {isLoading && (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                >
                                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                                </motion.div>
                            )}
                            {cepSuccess && !isLoading && (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-1 rounded-full bg-green-100 dark:bg-green-900/30"
                                >
                                    <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                                </motion.div>
                            )}
                            {cepError && !isLoading && (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0, scale: 0 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="p-1 rounded-full bg-red-100 dark:bg-red-900/30"
                                >
                                    <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>

                {cepError && (
                    <motion.p
                        initial={{ opacity: 0, y: -5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-sm text-red-500"
                    >
                        {cepError}
                    </motion.p>
                )}

                <div className="flex items-center justify-between">
                    <p className="text-xs text-muted-foreground">
                        Digite o CEP para preencher automaticamente
                    </p>
                    {!value.logradouro && (
                        <button
                            type="button"
                            onClick={() => {
                                // Enable manual entry mode
                                onChange({
                                    ...value,
                                    logradouro: ' ',  // Trigger fields to appear
                                    bairro: '',
                                    localidade: '',
                                    uf: '',
                                });
                            }}
                            className="text-xs text-primary hover:underline"
                        >
                            Não sei o CEP
                        </button>
                    )}
                </div>
            </div>

            {/* Address Fields - Animated appearance */}
            <AnimatePresence>
                {value.logradouro && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-4"
                    >
                        {/* Street */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                <Home className="h-4 w-4" />
                                Rua
                            </Label>
                            <Input
                                type="text"
                                value={value.logradouro || ''}
                                onChange={(e) => updateField('logradouro', e.target.value)}
                                disabled={disabled}
                                className="h-12 bg-muted/30"
                            />
                        </div>

                        {/* Number & Complement */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                                <Label>Número</Label>
                                <Input
                                    type="text"
                                    placeholder="123"
                                    value={value.numero || ''}
                                    onChange={(e) => updateField('numero', e.target.value)}
                                    disabled={disabled}
                                    className="h-12"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>Complemento</Label>
                                <Input
                                    type="text"
                                    placeholder="Apto, Bloco..."
                                    value={value.complemento || ''}
                                    onChange={(e) => updateField('complemento', e.target.value)}
                                    disabled={disabled}
                                    className="h-12"
                                />
                            </div>
                        </div>

                        {/* Neighborhood */}
                        <div className="space-y-2">
                            <Label>Bairro</Label>
                            <Input
                                type="text"
                                value={value.bairro || ''}
                                onChange={(e) => updateField('bairro', e.target.value)}
                                disabled={disabled}
                                className="h-12 bg-muted/30"
                            />
                        </div>

                        {/* City & State */}
                        <div className="grid grid-cols-3 gap-3">
                            <div className="col-span-2 space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4" />
                                    Cidade
                                </Label>
                                <Input
                                    type="text"
                                    value={value.localidade || ''}
                                    onChange={(e) => updateField('localidade', e.target.value)}
                                    disabled={disabled}
                                    className="h-12 bg-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>UF</Label>
                                <Input
                                    type="text"
                                    value={value.uf || ''}
                                    onChange={(e) => updateField('uf', e.target.value)}
                                    disabled={disabled}
                                    maxLength={2}
                                    className="h-12 bg-muted/30 text-center uppercase"
                                />
                            </div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Global error */}
            {error && (
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-sm text-red-500 flex items-center gap-1"
                >
                    <AlertCircle className="h-4 w-4" />
                    {error}
                </motion.p>
            )}
        </div>
    );
}

export default AddressAutocomplete;
