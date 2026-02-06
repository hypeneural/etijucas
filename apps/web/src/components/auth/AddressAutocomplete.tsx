import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MapPin, Loader2, Check, AlertCircle, Home, Building2, ChevronDown } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { cepService, formatCEP, cleanCEP, validateCEP } from '@/services/cep.service';
import type { Address, BairroOption, CepLookupResponse } from '@/types/auth.types';

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

    // Bairro selector state
    const [showBairroSelector, setShowBairroSelector] = useState(false);
    const [availableBairros, setAvailableBairros] = useState<BairroOption[]>([]);
    const [bairroLocked, setBairroLocked] = useState(false);

    const numeroInputRef = useRef<HTMLInputElement>(null);

    // Handle CEP input change
    const handleCepChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const raw = e.target.value;
        const clean = cleanCEP(raw);

        if (clean.length <= 8) {
            setCepInput(formatCEP(clean));
            setCepError(null);
            setCepSuccess(false);
            setShowBairroSelector(false);
            setBairroLocked(false);

            // Update only CEP in parent
            onChange({ ...value, cep: clean, bairroId: undefined });
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

                const response: CepLookupResponse = await cepService.lookup(clean);

                if (!response.success || !response.data) {
                    setCepError(response.message || 'Erro ao buscar CEP');
                    onChange({ cep: clean });
                    setIsLoading(false);
                    return;
                }

                const { address, match, ui_hints, available_bairros } = response.data;

                // Check city restriction
                if (!match.city_ok) {
                    setCepError(`Somente moradores de Tijucas podem se cadastrar. Este CEP é de ${address.city_name || 'outra cidade'}.`);
                    onChange({ cep: clean });
                    setIsLoading(false);
                    return;
                }

                // Update address with API data
                const newAddress: Partial<Address> = {
                    cep: clean,
                    logradouro: address.logradouro || '',
                    bairro: address.bairro_text || '',
                    localidade: 'Tijucas',
                    uf: 'SC',
                    complemento: address.complemento || undefined,
                };

                // If bairro matched, save bairroId
                if (match.bairro_ok && match.bairro_id) {
                    newAddress.bairroId = match.bairro_id;
                    setBairroLocked(true);
                    setCepSuccess(true);
                } else {
                    // Show bairro selector
                    setAvailableBairros(available_bairros || []);
                    setShowBairroSelector(true);
                    setBairroLocked(false);
                }

                onChange(newAddress);

                // Show toast if needed
                if (ui_hints.toast) {
                    // Could integrate with toast system here
                    console.info(ui_hints.toast);
                }

                // Focus numero if bairro matched
                if (ui_hints.focus_next === 'numero' && match.bairro_ok) {
                    setTimeout(() => numeroInputRef.current?.focus(), 100);
                }

                setIsLoading(false);
            };

            fetchAddress();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [cepInput]);

    // Update field handler
    const updateField = useCallback((field: keyof Address, fieldValue: string) => {
        onChange({ ...value, [field]: fieldValue });
    }, [onChange, value]);

    // Handle bairro selection
    const handleBairroSelect = useCallback((bairro: BairroOption) => {
        onChange({
            ...value,
            bairro: bairro.nome,
            bairroId: bairro.id,
        });
        setShowBairroSelector(false);
        setBairroLocked(true);
        setCepSuccess(true);
        setTimeout(() => numeroInputRef.current?.focus(), 100);
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
                                // Enable manual entry mode - fetch bairros
                                cepService.getBairros().then(setAvailableBairros);
                                setShowBairroSelector(true);
                                onChange({
                                    ...value,
                                    logradouro: ' ',
                                    bairro: '',
                                    localidade: 'Tijucas',
                                    uf: 'SC',
                                });
                            }}
                            className="text-xs text-primary hover:underline"
                        >
                            Não sei o CEP
                        </button>
                    )}
                </div>
            </div>

            {/* Bairro Selector - When bairro not matched */}
            <AnimatePresence>
                {showBairroSelector && availableBairros.length > 0 && !bairroLocked && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="space-y-2"
                    >
                        <Label className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                            <AlertCircle className="h-4 w-4" />
                            Selecione seu bairro
                        </Label>
                        <p className="text-xs text-muted-foreground">
                            Não conseguimos identificar seu bairro automaticamente. Selecione abaixo:
                        </p>
                        <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                            {availableBairros.map((bairro) => (
                                <motion.button
                                    key={bairro.id}
                                    type="button"
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => handleBairroSelect(bairro)}
                                    className={cn(
                                        'p-3 rounded-xl text-left text-sm font-medium transition-colors',
                                        'bg-muted hover:bg-primary hover:text-primary-foreground',
                                        value.bairroId === bairro.id && 'bg-primary text-primary-foreground'
                                    )}
                                >
                                    {bairro.nome}
                                </motion.button>
                            ))}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

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
                                    ref={numeroInputRef}
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

                        {/* Neighborhood - Show as locked if matched, or editable if manual */}
                        <div className="space-y-2">
                            <Label className="flex items-center gap-2">
                                Bairro
                                {bairroLocked && value.bairroId && (
                                    <span className="text-xs text-green-600 dark:text-green-400 flex items-center gap-1">
                                        <Check className="h-3 w-3" /> Verificado
                                    </span>
                                )}
                            </Label>
                            <div className="relative">
                                <Input
                                    type="text"
                                    value={value.bairro || ''}
                                    onChange={(e) => {
                                        if (!bairroLocked) {
                                            updateField('bairro', e.target.value);
                                        }
                                    }}
                                    disabled={disabled || bairroLocked}
                                    className={cn(
                                        'h-12 bg-muted/30',
                                        bairroLocked && 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
                                    )}
                                />
                                {bairroLocked && (
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setBairroLocked(false);
                                            setShowBairroSelector(true);
                                            cepService.getBairros().then(setAvailableBairros);
                                        }}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-primary hover:underline"
                                    >
                                        Alterar
                                    </button>
                                )}
                            </div>
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
                                    value={value.localidade || 'Tijucas'}
                                    disabled={true}
                                    className="h-12 bg-muted/30"
                                />
                            </div>

                            <div className="space-y-2">
                                <Label>UF</Label>
                                <Input
                                    type="text"
                                    value={value.uf || 'SC'}
                                    disabled={true}
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
