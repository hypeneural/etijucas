import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface HelpTooltipProps {
    title: string;
    content: string | string[];
    className?: string;
}

export function HelpTooltip({ title, content, className }: HelpTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    const contentArray = Array.isArray(content) ? content : [content];

    return (
        <div className={cn('inline-flex items-center gap-1', className)}>
            <motion.button
                type="button"
                whileTap={{ scale: 0.9 }}
                onClick={() => setIsOpen(true)}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-muted hover:bg-muted/80 transition-colors"
                aria-label={`Ajuda sobre ${title}`}
            >
                <Info className="h-3 w-3 text-muted-foreground" />
            </motion.button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 z-50 bg-black/40"
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Bottom sheet */}
                        <motion.div
                            initial={{ y: '100%' }}
                            animate={{ y: 0 }}
                            exit={{ y: '100%' }}
                            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                            className="fixed bottom-0 left-0 right-0 z-50 rounded-t-3xl bg-background p-6 safe-bottom"
                        >
                            {/* Handle */}
                            <div className="absolute top-3 left-1/2 -translate-x-1/2 h-1 w-10 rounded-full bg-muted" />

                            <div className="flex items-start justify-between mt-2">
                                <div className="flex items-center gap-2">
                                    <div className="p-2 rounded-full bg-primary/10">
                                        <Info className="h-4 w-4 text-primary" />
                                    </div>
                                    <h3 className="font-semibold text-lg">{title}</h3>
                                </div>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 rounded-full"
                                    onClick={() => setIsOpen(false)}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>

                            <div className="mt-4 space-y-2">
                                {contentArray.map((text, index) => (
                                    <p key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                                        <span className="text-primary mt-0.5">•</span>
                                        <span>{text}</span>
                                    </p>
                                ))}
                            </div>

                            <Button
                                className="w-full mt-6"
                                onClick={() => setIsOpen(false)}
                            >
                                Entendi
                            </Button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

interface StepHeaderProps {
    title: string;
    subtitle?: string;
    helpTitle?: string;
    helpContent?: string | string[];
}

export function StepHeader({ title, subtitle, helpTitle, helpContent }: StepHeaderProps) {
    return (
        <div className="space-y-1">
            <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold">{title}</h1>
                {helpContent && (
                    <HelpTooltip
                        title={helpTitle || title}
                        content={helpContent}
                    />
                )}
            </div>
            {subtitle && (
                <p className="text-sm text-muted-foreground">{subtitle}</p>
            )}
        </div>
    );
}
