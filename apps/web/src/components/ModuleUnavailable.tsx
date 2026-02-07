/**
 * ModuleUnavailable Component
 * 
 * Displayed when a module is not enabled for the current city.
 * Provides a friendly message and navigation back to home.
 */

import { useTenantNavigate } from '@/hooks';
import { motion } from 'framer-motion';
import { Lock, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTenantStore } from '@/store/useTenantStore';

interface ModuleUnavailableProps {
    moduleName?: string;
    moduleSlug?: string;
}

export function ModuleUnavailable({ moduleName, moduleSlug }: ModuleUnavailableProps) {
    const navigate = useTenantNavigate();
    const cityName = useTenantStore((s) => s.city?.name || 'sua cidade');

    return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-muted/30 via-background to-muted/50">
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-md w-full text-center space-y-6"
            >
                {/* Icon */}
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.1, bounce: 0.5 }}
                    className="inline-flex p-6 rounded-full bg-muted/50 border border-border"
                >
                    <Lock className="h-12 w-12 text-muted-foreground" />
                </motion.div>

                {/* Title */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <h1 className="text-2xl font-bold text-foreground">
                        Módulo Indisponível
                    </h1>
                    <p className="mt-2 text-muted-foreground">
                        {moduleName ? (
                            <>
                                O módulo <strong>{moduleName}</strong> ainda não está disponível para{' '}
                                <strong>{cityName}</strong>.
                            </>
                        ) : (
                            <>
                                Este recurso ainda não está disponível para{' '}
                                <strong>{cityName}</strong>.
                            </>
                        )}
                    </p>
                </motion.div>

                {/* Info */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="text-sm text-muted-foreground"
                >
                    Estamos trabalhando para ativar novos recursos em breve!
                </motion.p>

                {/* Actions */}
                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="flex flex-col gap-3"
                >
                    <Button
                        size="lg"
                        onClick={() => navigate('/')}
                        className="w-full h-12 rounded-xl"
                    >
                        <Home className="h-5 w-5 mr-2" />
                        Voltar para Início
                    </Button>

                    <Button
                        variant="ghost"
                        onClick={() => navigate(-1)}
                        className="w-full h-10"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Voltar
                    </Button>
                </motion.div>
            </motion.div>
        </div>
    );
}

export default ModuleUnavailable;
