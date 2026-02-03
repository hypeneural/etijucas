import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    MapPin,
    Camera,
    Edit2,
    CheckCircle,
    Loader2,
    ChevronRight,
    AlertTriangle,
    FileCheck,
    Send,
    Info,
    FileText,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import { useReportCategories } from '@/hooks/useReportCategories';
import type { ReportDraft } from '@/types/report';

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
    const { categories } = useReportCategories();

    const selectedCategory = categories.find(c => c.id === draft.categoryId);

    // Validation: title is required, category, location, confirmed
    const canSubmit = !!draft.categoryId && !!draft.location && draft.confirmed && !!draft.title?.trim();

    const handleSubmit = async () => {
        if (!canSubmit) return;

        setIsSubmitting(true);

        try {
            await onSubmit();
        } catch (error) {
            console.error('Submit error:', error);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="space-y-4 pb-48">
            <StepHeader
                title="Revisar e enviar"
                subtitle="Adicione um título e confira as informações"
                helpTitle="Última etapa!"
                helpContent={[
                    "Adicione um título curto que descreva o problema.",
                    "Revise todas as informações antes de enviar.",
                    "Após enviar, você receberá um número de protocolo."
                ]}
            />

            {/* Title Input - REQUIRED */}
            <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                    <FileText className="h-4 w-4 text-muted-foreground" />
                    Título da denúncia *
                </label>
                <Input
                    placeholder="Ex: Buraco grande na Rua Principal"
                    value={draft.title || ''}
                    onChange={(e) => onUpdate({ title: e.target.value })}
                    className="h-12 rounded-xl"
                    maxLength={100}
                />
                <p className="text-xs text-muted-foreground">
                    Descreva o problema em poucas palavras (obrigatório)
                </p>
            </div>

            {/* Category Summary */}
            <Card className="p-4">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <div
                            className="p-3 rounded-xl text-2xl"
                            style={{ backgroundColor: selectedCategory?.color + '20' }}
                        >
                            {selectedCategory?.icon || '❓'}
                        </div>
                        <div>
                            <p className="text-sm text-muted-foreground">Categoria</p>
                            <p className="font-semibold">{selectedCategory?.name || 'Não selecionada'}</p>
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
                            {draft.location?.quality && (
                                <Badge variant="secondary" className="mt-1 text-xs capitalize">
                                    {draft.location.quality}
                                </Badge>
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
                    placeholder="Algum detalhe importante? (máx. 500 caracteres)"
                    maxLength={500}
                    value={draft.description}
                    onChange={(e) => onUpdate({ description: e.target.value })}
                    className="min-h-[100px] rounded-xl resize-none"
                />
                <p className="text-xs text-muted-foreground text-right">
                    {draft.description.length}/500
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
                                : 'Marque para poder enviar a denúncia'}
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
                                {!draft.title?.trim() && <li>• Adicione um título</li>}
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
