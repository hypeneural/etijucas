import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin,
    Camera,
    Edit2,
    CheckCircle,
    Loader2,
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
    AlertTriangle,
    FileCheck,
    Send,
    Info,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import type { ReportDraft, Category } from '@/types/report';
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

interface StepReviewProps {
    draft: ReportDraft;
    onUpdate: (updates: Partial<ReportDraft>) => void;
    onBack: () => void;
    onGoToStep: (step: number) => void;
    onSubmit: () => Promise<void>;
}

export function StepReview({
    draft,
    onUpdate,
    onBack,
    onGoToStep,
    onSubmit
}: StepReviewProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitSuccess, setSubmitSuccess] = useState(false);
    const [protocolNumber, setProtocolNumber] = useState<string | null>(null);

    const categories = categoriesData.categories as Category[];
    const selectedCategory = categories.find(c => c.id === draft.categoryId);
    const CategoryIcon = selectedCategory ? iconMap[selectedCategory.icon] || HelpCircle : HelpCircle;

    const canSubmit = draft.categoryId && draft.location && draft.confirmed;

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSubmitting(true);

        try {
            await onSubmit();

            const year = new Date().getFullYear();
            const randomNum = Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
            setProtocolNumber(`#TJ-${year}-${randomNum}`);
            setSubmitSuccess(true);
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    // Success screen
    if (submitSuccess && protocolNumber) {
        return (
            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center"
            >
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', delay: 0.2 }}
                    className="p-6 rounded-full bg-green-100 dark:bg-green-900/30 mb-6"
                >
                    <CheckCircle className="h-16 w-16 text-green-600 dark:text-green-400" />
                </motion.div>

                <motion.h1
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="text-2xl font-bold mb-2"
                >
                    Denúncia enviada!
                </motion.h1>

                <motion.p
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="text-muted-foreground mb-6"
                >
                    Obrigado por ajudar a melhorar Tijucas!
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="w-full max-w-xs"
                >
                    <Card className="p-4 bg-muted/50">
                        <div className="flex items-center gap-2 justify-center mb-2">
                            <FileCheck className="h-5 w-5 text-primary" />
                            <span className="text-sm text-muted-foreground">Seu protocolo:</span>
                        </div>
                        <p className="text-xl font-bold font-mono">{protocolNumber}</p>
                    </Card>
                </motion.div>

                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                    className="text-xs text-muted-foreground mt-4 max-w-xs"
                >
                    Guarde este número para acompanhar o andamento da sua denúncia
                </motion.p>

                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.8 }}
                    className="mt-8"
                >
                    <Button
                        size="lg"
                        className="h-14 px-8 rounded-2xl"
                        onClick={() => window.location.href = '/'}
                    >
                        Voltar para o início
                    </Button>
                </motion.div>
            </motion.div>
        );
    }

    return (
        <div className="space-y-4 pb-48">
            <StepHeader
                title="Revisar e enviar"
                subtitle="Confira se está tudo certo antes de enviar"
                helpTitle="Última etapa!"
                helpContent={[
                    "Revise todas as informações antes de enviar.",
                    "Você pode voltar e editar qualquer etapa tocando em 'Editar'.",
                    "Após enviar, você receberá um número de protocolo para acompanhar."
                ]}
            />

            {/* Review instructions */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="text-sm text-blue-700 dark:text-blue-300">
                        <p>Confira as informações abaixo. Se algo estiver errado, toque em
                            <span className="font-medium"> Editar</span> para corrigir.</p>
                    </div>
                </div>
            </Card>

            {/* Category Summary */}
            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <CategoryIcon className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Categoria</p>
                            <p className="font-semibold">{selectedCategory?.label || 'Não selecionada'}</p>
                            {draft.subcategory && (
                                <Badge variant="secondary" className="mt-1 text-xs">
                                    {draft.subcategory}
                                </Badge>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGoToStep(1)}
                        className="text-primary"
                    >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                    </Button>
                </div>
            </Card>

            {/* Location Summary */}
            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <MapPin className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Localização</p>
                            <p className="font-semibold">
                                {draft.location?.address || 'Localização capturada'}
                            </p>
                            {draft.location?.reference && (
                                <p className="text-sm text-muted-foreground mt-0.5">
                                    Ref: {draft.location.reference}
                                </p>
                            )}
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGoToStep(2)}
                        className="text-primary"
                    >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                    </Button>
                </div>
            </Card>

            {/* Photos Summary */}
            <Card className="p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                        <div className="p-3 rounded-xl bg-primary/10">
                            <Camera className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Fotos</p>
                            <p className="font-semibold">
                                {draft.images.length} {draft.images.length === 1 ? 'foto anexada' : 'fotos anexadas'}
                            </p>
                        </div>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onGoToStep(3)}
                        className="text-primary"
                    >
                        <Edit2 className="h-4 w-4 mr-1" />
                        Editar
                    </Button>
                </div>

                {draft.images.length > 0 ? (
                    <div className="flex gap-2 overflow-x-auto pb-1">
                        {draft.images.map((image, index) => (
                            <img
                                key={image.id}
                                src={image.previewUrl}
                                alt={`Foto ${index + 1}`}
                                className="h-20 w-20 rounded-lg object-cover shrink-0"
                            />
                        ))}
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <AlertTriangle className="h-4 w-4" />
                        <p className="text-sm">Nenhuma foto anexada (opcional)</p>
                    </div>
                )}
            </Card>

            {/* Description */}
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                    <FileCheck className="h-4 w-4 text-muted-foreground" />
                    Descrição adicional (opcional)
                </label>
                <Textarea
                    placeholder="Algum detalhe importante que queira adicionar? (máx. 280 caracteres)"
                    maxLength={280}
                    value={draft.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="min-h-[100px] rounded-xl resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                    {draft.description.length}/280
                </p>
            </div>

            {/* Confirmation Checkbox */}
            <Card className={cn(
                'p-4 transition-all border-2',
                draft.confirmed
                    ? 'border-green-400 bg-green-50 dark:bg-green-950/20 dark:border-green-700'
                    : 'border-amber-400 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-700'
            )}>
                <label className="flex items-start gap-3 cursor-pointer">
                    <Checkbox
                        checked={draft.confirmed}
                        onCheckedChange={(checked) => onUpdate({ confirmed: !!checked })}
                        className="mt-0.5 h-5 w-5"
                    />
                    <div>
                        <p className={cn(
                            'font-medium',
                            draft.confirmed ? 'text-green-700 dark:text-green-300' : 'text-amber-700 dark:text-amber-300'
                        )}>
                            {draft.confirmed ? (
                                <span className="flex items-center gap-2">
                                    <CheckCircle className="h-4 w-4" />
                                    Confirmado!
                                </span>
                            ) : (
                                'Confirmo que as informações são verdadeiras'
                            )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                            {draft.confirmed
                                ? 'Você confirmou que as informações são verdadeiras'
                                : 'Marque esta opção para poder enviar a denúncia'}
                        </p>
                    </div>
                </label>
            </Card>

            {/* Error message if can't submit */}
            {!canSubmit && (
                <Card className="p-4 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-red-600 dark:text-red-400 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-red-800 dark:text-red-300">
                                Não é possível enviar ainda
                            </p>
                            <ul className="text-sm text-red-700 dark:text-red-400 mt-1 space-y-1">
                                {!draft.categoryId && <li>• Selecione uma categoria</li>}
                                {!draft.location && <li>• Capture sua localização</li>}
                                {!draft.confirmed && <li>• Confirme que as informações são verdadeiras</li>}
                            </ul>
                        </div>
                    </div>
                </Card>
            )}

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background/95 backdrop-blur-lg border-t z-10">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 rounded-2xl flex-1 text-base"
                        onClick={onBack}
                        disabled={isSubmitting}
                    >
                        Voltar
                    </Button>
                    <Button
                        size="lg"
                        className={cn(
                            'h-14 rounded-2xl flex-[2] text-base font-semibold',
                            canSubmit
                                ? 'bg-green-600 hover:bg-green-700'
                                : 'opacity-50'
                        )}
                        disabled={!canSubmit || isSubmitting}
                        onClick={handleSubmit}
                    >
                        {isSubmitting ? (
                            <>
                                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                Enviando...
                            </>
                        ) : (
                            <>
                                <Send className="h-5 w-5 mr-2" />
                                Enviar denúncia
                            </>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

