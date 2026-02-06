import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, List, MapPin, Camera, FileSearch } from 'lucide-react';

interface WizardProgressProps {
    currentStep: number;
    totalSteps: number;
    labels?: string[];
}

// Step icons mapping
const stepIcons = [
    { icon: List, label: 'Categoria' },
    { icon: MapPin, label: 'Localização' },
    { icon: Camera, label: 'Fotos' },
    { icon: FileSearch, label: 'Revisão' },
];

export function WizardProgress({ currentStep, totalSteps, labels }: WizardProgressProps) {
    const progress = (currentStep / totalSteps) * 100;

    return (
        <div className="space-y-4">
            {/* Step indicator with icons */}
            <div className="flex items-center justify-between">
                {stepIcons.slice(0, totalSteps).map((step, index) => {
                    const stepNum = index + 1;
                    const isCompleted = stepNum < currentStep;
                    const isCurrent = stepNum === currentStep;
                    const Icon = step.icon;

                    return (
                        <div key={stepNum} className="flex flex-col items-center flex-1">
                            {/* Connector line */}
                            {index > 0 && (
                                <div
                                    className={cn(
                                        'absolute h-0.5 -translate-y-4',
                                        isCompleted || isCurrent
                                            ? 'bg-primary'
                                            : 'bg-muted'
                                    )}
                                    style={{
                                        width: `calc(100% / ${totalSteps} - 2rem)`,
                                        left: `calc((100% / ${totalSteps}) * ${index} + 1rem)`,
                                    }}
                                />
                            )}

                            {/* Step circle with icon */}
                            <motion.div
                                initial={{ scale: 0.8 }}
                                animate={{
                                    scale: isCurrent ? 1.1 : 1,
                                }}
                                className={cn(
                                    'relative z-10 h-10 w-10 rounded-full flex items-center justify-center transition-all',
                                    isCompleted && 'bg-primary text-primary-foreground',
                                    isCurrent && 'bg-primary text-primary-foreground ring-4 ring-primary/20',
                                    !isCompleted && !isCurrent && 'bg-muted text-muted-foreground'
                                )}
                            >
                                {isCompleted ? (
                                    <Check className="h-5 w-5" />
                                ) : (
                                    <Icon className="h-5 w-5" />
                                )}
                            </motion.div>

                            {/* Step label */}
                            <span
                                className={cn(
                                    'text-xs mt-1.5 font-medium text-center',
                                    isCurrent && 'text-primary',
                                    isCompleted && 'text-foreground',
                                    !isCompleted && !isCurrent && 'text-muted-foreground'
                                )}
                            >
                                {labels?.[index] || step.label}
                            </span>
                        </div>
                    );
                })}
            </div>

            {/* Connecting lines (alternative approach) */}
            <div className="relative -mt-[3.2rem] mx-5 h-0.5 bg-muted rounded-full">
                <motion.div
                    className="h-full bg-primary rounded-full"
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentStep - 1) / (totalSteps - 1)) * 100}%` }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                />
            </div>

        </div>
    );
}
