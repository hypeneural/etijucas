import { motion } from 'framer-motion';
import {
    Loader2,
    ChevronRight,
    Info,
    Lightbulb,
    HelpCircle,
    AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import { useReportCategories } from '@/hooks/useReportCategories';
import type { ReportDraft, ReportCategory } from '@/types/report';

interface StepCategoryProps {
    draft: ReportDraft;
    onUpdate: (updates: Partial<ReportDraft>) => void;
    onNext: () => void;
}

export function StepCategory({ draft, onUpdate, onNext }: StepCategoryProps) {
    const { categories, isLoading, error, refetch } = useReportCategories();

    const selectedCategory = categories.find(c => c.id === draft.categoryId);

    const handleSelectCategory = (category: ReportCategory) => {
        onUpdate({
            categoryId: category.id,
            category: category,
        });
    };

    const canContinue = !!draft.categoryId;

    // Loading state
    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-muted-foreground">Carregando categorias...</p>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
                <AlertCircle className="h-12 w-12 text-destructive" />
                <p className="text-muted-foreground text-center">
                    Erro ao carregar categorias.
                </p>
                <Button onClick={() => refetch()} variant="outline">
                    Tentar novamente
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-48">
            <StepHeader
                title="O que aconteceu?"
                subtitle="Escolha a categoria que melhor descreve o problema"
                helpTitle="Como escolher a categoria"
                helpContent={[
                    "Escolha a categoria que mais combina com o problema que você quer reportar.",
                    "Se tiver dúvida, escolha 'Outros' e descreva com suas palavras.",
                    "Não se preocupe em acertar perfeitamente, nossa equipe vai analisar."
                ]}
            />

            {/* Instructions Card */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-blue-700 dark:text-blue-300">
                            <span className="font-medium">Toque em uma categoria</span> para selecioná-la.
                            Depois você pode detalhar melhor o problema.
                        </p>
                    </div>
                </div>
            </Card>

            {/* Category Grid */}
            <div className="grid grid-cols-2 gap-3">
                {categories.map((category, index) => {
                    const isSelected = draft.categoryId === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            type="button"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectCategory(category)}
                            className={cn(
                                'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                                isSelected
                                    ? 'border-primary bg-primary/10 shadow-lg'
                                    : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                            )}
                        >
                            {/* Icon from API (emoji) */}
                            <div
                                className={cn(
                                    'text-3xl p-2 rounded-xl transition-colors',
                                    isSelected ? 'bg-primary/20' : 'bg-muted'
                                )}
                                style={{
                                    backgroundColor: isSelected ? `${category.color}20` : undefined
                                }}
                            >
                                {category.icon}
                            </div>
                            <span className={cn(
                                'text-sm font-medium leading-tight',
                                isSelected && 'text-primary'
                            )}
                                style={{ color: isSelected ? category.color : undefined }}
                            >
                                {category.name}
                            </span>
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                                    style={{ backgroundColor: category.color }}
                                >
                                    <ChevronRight className="h-3 w-3 text-white" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Tips from selected category */}
            {selectedCategory && selectedCategory.tips.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                >
                    <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                        <div className="flex items-start gap-3">
                            <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                            </div>
                            <div className="flex-1">
                                <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                    Dicas para "{selectedCategory.name}"
                                </p>
                                <ul className="mt-2 space-y-1">
                                    {selectedCategory.tips.map((tip, i) => (
                                        <li key={i} className="text-sm text-amber-700 dark:text-amber-400 flex gap-2">
                                            <span className="shrink-0">•</span>
                                            <span>{tip}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        </div>
                    </Card>
                </motion.div>
            )}

            {/* No selection hint */}
            {!draft.categoryId && (
                <Card className="p-4 border-muted bg-muted/30">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-muted">
                            <HelpCircle className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground">
                            Selecione uma categoria acima para continuar
                        </p>
                    </div>
                </Card>
            )}

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background/95 backdrop-blur-lg border-t z-10">
                <div className="max-w-lg mx-auto">
                    <Button
                        size="lg"
                        className={cn(
                            "w-full h-14 text-base font-semibold rounded-2xl transition-all",
                            !canContinue && "opacity-50"
                        )}
                        disabled={!canContinue}
                        onClick={onNext}
                    >
                        {canContinue ? (
                            <>
                                Continuar
                                <ChevronRight className="h-5 w-5 ml-2" />
                            </>
                        ) : (
                            'Selecione uma categoria'
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}
