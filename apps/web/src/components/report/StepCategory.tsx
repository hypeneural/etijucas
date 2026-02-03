import { motion } from 'framer-motion';
import {
    Construction,
    TreePine,
    Lightbulb,
    Trash2,
    Waves,
    Stethoscope,
    Volume2,
    TrafficCone,
    Trees,
    HelpCircle,
    ChevronRight,
    Info,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import type { Category, ReportDraft } from '@/types/report';
import categoriesData from '@/data/report.mock.json';

// Icon mapping
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'construction': Construction,
    'tree-pine': TreePine,
    'lightbulb': Lightbulb,
    'trash-2': Trash2,
    'waves': Waves,
    'stethoscope': Stethoscope,
    'volume-2': Volume2,
    'traffic-cone': TrafficCone,
    'trees': Trees,
    'help-circle': HelpCircle,
};

interface StepCategoryProps {
    draft: ReportDraft;
    onUpdate: (updates: Partial<ReportDraft>) => void;
    onNext: () => void;
}

export function StepCategory({ draft, onUpdate, onNext }: StepCategoryProps) {
    const categories = categoriesData.categories as Category[];
    const selectedCategory = categories.find(c => c.id === draft.categoryId);

    const handleSelectCategory = (categoryId: string) => {
        onUpdate({
            categoryId,
            subcategory: null
        });
    };

    const handleSelectSubcategory = (subcategory: string) => {
        onUpdate({
            subcategory: draft.subcategory === subcategory ? null : subcategory
        });
    };

    const canContinue = !!draft.categoryId;

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
                    const Icon = iconMap[category.icon] || HelpCircle;
                    const isSelected = draft.categoryId === category.id;

                    return (
                        <motion.button
                            key={category.id}
                            type="button"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.03 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => handleSelectCategory(category.id)}
                            className={cn(
                                'relative flex flex-col items-center gap-2 rounded-2xl border-2 p-4 text-center transition-all',
                                isSelected
                                    ? 'border-primary bg-primary/10 shadow-lg'
                                    : 'border-border bg-card hover:bg-muted/50 hover:border-muted-foreground/30'
                            )}
                        >
                            <div className={cn(
                                'p-3 rounded-xl transition-colors',
                                isSelected ? 'bg-primary text-primary-foreground' : 'bg-muted'
                            )}>
                                <Icon className="h-6 w-6" />
                            </div>
                            <span className={cn(
                                'text-sm font-medium leading-tight',
                                isSelected && 'text-primary'
                            )}>
                                {category.label}
                            </span>
                            {isSelected && (
                                <motion.div
                                    initial={{ scale: 0 }}
                                    animate={{ scale: 1 }}
                                    className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary flex items-center justify-center"
                                >
                                    <ChevronRight className="h-3 w-3 text-primary-foreground" />
                                </motion.div>
                            )}
                        </motion.button>
                    );
                })}
            </div>

            {/* Subcategories */}
            {selectedCategory && selectedCategory.subcategories.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    className="space-y-3"
                >
                    <div className="flex items-center gap-2">
                        <div className="h-px flex-1 bg-border" />
                        <span className="text-sm text-muted-foreground px-2">Detalhe (opcional)</span>
                        <div className="h-px flex-1 bg-border" />
                    </div>

                    <p className="text-sm text-muted-foreground">
                        Selecione uma opção que descreva melhor o problema:
                    </p>

                    <div className="flex flex-wrap gap-2">
                        {selectedCategory.subcategories.map((sub) => (
                            <motion.div key={sub} whileTap={{ scale: 0.95 }}>
                                <Badge
                                    variant={draft.subcategory === sub ? 'default' : 'outline'}
                                    className={cn(
                                        'cursor-pointer px-3 py-2 text-sm transition-all',
                                        draft.subcategory === sub
                                            ? 'bg-primary hover:bg-primary/90'
                                            : 'hover:bg-muted'
                                    )}
                                    onClick={() => handleSelectSubcategory(sub)}
                                >
                                    {sub}
                                </Badge>
                            </motion.div>
                        ))}
                    </div>

                    {/* Tips */}
                    {selectedCategory.tips.length > 0 && (
                        <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-lg bg-amber-100 dark:bg-amber-900/50">
                                    <Lightbulb className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                                        Dica para "{selectedCategory.label}"
                                    </p>
                                    <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                        {selectedCategory.tips[0]}
                                    </p>
                                </div>
                            </div>
                        </Card>
                    )}
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
