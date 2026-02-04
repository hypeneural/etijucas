/**
 * MarineExplainer - Componentes didáticos para dados do mar
 * Explica termos técnicos de forma simples para leigos
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { cn } from '@/lib/utils';

// ======================================================
// Explicações das métricas marítimas
// ======================================================

export const MARINE_EXPLANATIONS: Record<string, {
    title: string;
    simple: string;
    detail: string;
    icon: string;
    tip?: string;
}> = {
    wave_height: {
        title: 'Altura das Ondas',
        simple: 'O tamanho das ondas do mar',
        detail: 'Medida da base ao topo da onda. Ondas acima de 1.5m são consideradas grandes e podem ser perigosas para banhistas.',
        icon: 'mdi:waves',
        tip: 'Até 0.5m = calmo, 0.5-1m = moderado, >1.5m = agitado',
    },
    wave_period: {
        title: 'Período da Onda',
        simple: 'O tempo entre uma onda e outra',
        detail: 'Quanto maior o período, mais energia a onda carrega. Períodos longos (>10s) indicam ondulação de alto mar (swell) que chega com força.',
        icon: 'mdi:timer-outline',
        tip: 'Período curto (<6s) = ondas locais. Período longo (>10s) = ondas mais fortes',
    },
    wave_direction: {
        title: 'Direção da Onda',
        simple: 'De onde as ondas estão vindo',
        detail: 'Indica a origem das ondas. Importante para surfistas (entender a formação) e para quem está na praia (proteção natural de baías).',
        icon: 'mdi:compass',
        tip: 'Compare com a orientação da praia para saber se está protegida',
    },
    swell: {
        title: 'Swell (Ondulação)',
        simple: 'Ondas que viajaram de longe',
        detail: 'São ondas geradas por tempestades distantes no oceano. Chegam organizadas e com mais energia que as ondas locais.',
        icon: 'mdi:wave',
        tip: 'Swell grande + período longo = mar forte mesmo sem vento local',
    },
    sea_temp: {
        title: 'Temperatura do Mar',
        simple: 'Quão quente ou fria está a água',
        detail: 'A temperatura da superfície do mar. Varia com as correntes, estação e profundidade.',
        icon: 'mdi:thermometer',
        tip: 'Acima de 25°C = confortável. Abaixo de 20°C = água fria',
    },
    current: {
        title: 'Corrente Marinha',
        simple: 'Movimento da água no mar',
        detail: 'A velocidade e direção do fluxo de água. Correntes fortes podem arrastar banhistas e dificultar a natação.',
        icon: 'mdi:current-ac',
        tip: 'Acima de 0.5 m/s requer atenção. Não lute contra a corrente!',
    },
    wind_wave: {
        title: 'Ondas de Vento',
        simple: 'Ondas criadas pelo vento local',
        detail: 'Estas ondas são geradas pelo vento que está soprando agora. São mais curtas e desorganizadas que o swell.',
        icon: 'mdi:weather-windy',
        tip: 'Com muito vento, o mar fica "picado" mesmo com ondas pequenas',
    },
};

// ======================================================
// ExplainableMetric - Métrica com tooltip explicativo
// ======================================================

interface ExplainableMetricProps {
    metricKey: keyof typeof MARINE_EXPLANATIONS;
    value: string | number;
    unit?: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
    showLabel?: boolean;
}

export function ExplainableMetric({
    metricKey,
    value,
    unit = '',
    className,
    size = 'md',
    showLabel = true,
}: ExplainableMetricProps) {
    const [isOpen, setIsOpen] = useState(false);
    const explanation = MARINE_EXPLANATIONS[metricKey];

    if (!explanation) return null;

    const sizeStyles = {
        sm: { icon: 'h-4 w-4', value: 'text-sm', label: 'text-xs' },
        md: { icon: 'h-5 w-5', value: 'text-lg', label: 'text-xs' },
        lg: { icon: 'h-6 w-6', value: 'text-2xl', label: 'text-sm' },
    }[size];

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className={cn(
                    "text-left group relative",
                    "hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg p-2 -m-2 transition-colors",
                    className
                )}
            >
                <div className="flex items-center gap-2">
                    <Icon icon={explanation.icon} className={cn(sizeStyles.icon, "text-cyan-600")} />
                    <div>
                        <div className={cn("font-bold", sizeStyles.value)}>
                            {value}{unit}
                        </div>
                        {showLabel && (
                            <div className={cn("text-muted-foreground flex items-center gap-1", sizeStyles.label)}>
                                {explanation.title}
                                <Icon icon="mdi:help-circle-outline" className="h-3 w-3 opacity-50 group-hover:opacity-100" />
                            </div>
                        )}
                    </div>
                </div>
            </button>

            <ExplanationModal
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                explanation={explanation}
            />
        </>
    );
}

// ======================================================
// ExplanationModal - Modal com explicação detalhada
// ======================================================

interface ExplanationModalProps {
    isOpen: boolean;
    onClose: () => void;
    explanation: typeof MARINE_EXPLANATIONS[string];
}

function ExplanationModal({ isOpen, onClose, explanation }: ExplanationModalProps) {
    return (
        <AnimatePresence>
            {isOpen && (
                <>
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                    />

                    {/* Modal */}
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="fixed left-4 right-4 bottom-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl z-50 max-w-md mx-auto"
                    >
                        <div className="flex items-start gap-4">
                            <div className="p-3 rounded-full bg-cyan-100 dark:bg-cyan-900/40">
                                <Icon icon={explanation.icon} className="h-6 w-6 text-cyan-600" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-lg font-semibold mb-1">{explanation.title}</h3>
                                <p className="text-lg text-cyan-600 dark:text-cyan-400 mb-2">
                                    {explanation.simple}
                                </p>
                                <p className="text-sm text-muted-foreground mb-3">
                                    {explanation.detail}
                                </p>
                                {explanation.tip && (
                                    <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
                                        <div className="flex items-start gap-2">
                                            <Icon icon="mdi:lightbulb-outline" className="h-4 w-4 text-amber-600 mt-0.5" />
                                            <span className="text-sm text-amber-800 dark:text-amber-200">
                                                {explanation.tip}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <button
                            onClick={onClose}
                            className="mt-4 w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            Entendi
                        </button>
                    </motion.div>
                </>
            )}
        </AnimatePresence>
    );
}

// ======================================================
// CoastalPrecisionBanner - Aviso de precisão costeira
// ======================================================

export function CoastalPrecisionBanner({ className }: { className?: string }) {
    const [showDetail, setShowDetail] = useState(false);

    return (
        <div className={className}>
            <motion.button
                onClick={() => setShowDetail(!showDetail)}
                className={cn(
                    "w-full p-3 rounded-xl text-left transition-colors",
                    "bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800"
                )}
            >
                <div className="flex items-center gap-2">
                    <Icon icon="mdi:information-outline" className="h-5 w-5 text-blue-500" />
                    <span className="text-sm text-blue-700 dark:text-blue-300">
                        Dados do mar têm precisão limitada perto da costa
                    </span>
                    <Icon
                        icon="mdi:chevron-down"
                        className={cn(
                            "h-4 w-4 ml-auto text-blue-500 transition-transform",
                            showDetail && "rotate-180"
                        )}
                    />
                </div>
            </motion.button>

            <AnimatePresence>
                {showDetail && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-4 pt-2 text-sm text-muted-foreground space-y-2">
                            <p>
                                Os modelos meteorológicos usam grades de ~5km, então dados próximos à costa
                                podem ser influenciados por células terrestres.
                            </p>
                            <p>
                                Usamos a configuração <code className="bg-gray-100 dark:bg-gray-800 px-1 rounded">cell_selection=sea</code>
                                para priorizar dados oceânicos, mas em praias muito rasas ou baías protegidas
                                a realidade pode diferir.
                            </p>
                            <p className="font-medium text-foreground">
                                💡 Sempre observe as condições locais antes de entrar no mar.
                            </p>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
}

// ======================================================  
// AnimatedWaveIcon - Ícone de onda animado
// ======================================================

export function AnimatedWaveIcon({
    height,
    condition,
    className
}: {
    height: number;
    condition: 'calm' | 'moderate' | 'rough';
    className?: string;
}) {
    const animationSpeed = condition === 'calm' ? 3 : condition === 'moderate' ? 2 : 1;
    const amplitude = condition === 'calm' ? 2 : condition === 'moderate' ? 4 : 6;

    return (
        <motion.div
            animate={{ y: [-amplitude, amplitude, -amplitude] }}
            transition={{
                duration: animationSpeed,
                repeat: Infinity,
                ease: "easeInOut"
            }}
            className={className}
        >
            <Icon
                icon="mdi:waves"
                className={cn(
                    "h-8 w-8",
                    condition === 'calm' && "text-emerald-500",
                    condition === 'moderate' && "text-amber-500",
                    condition === 'rough' && "text-red-500"
                )}
            />
        </motion.div>
    );
}

// ======================================================
// SeaConditionHero - Card hero de condição do mar
// ======================================================

export function SeaConditionHero({
    waveHeight,
    wavePeriod,
    seaTemp,
    className
}: {
    waveHeight: number;
    wavePeriod: number;
    seaTemp?: number;
    className?: string;
}) {
    // Classify condition
    const condition: 'calm' | 'moderate' | 'rough' =
        waveHeight >= 1.5 || (waveHeight >= 1.0 && wavePeriod >= 10)
            ? 'rough'
            : waveHeight >= 0.8
                ? 'moderate'
                : 'calm';

    const conditionConfig = {
        calm: {
            emoji: '✅',
            label: 'Mar Calmo',
            description: 'Bom para banho e atividades aquáticas',
            bg: 'from-emerald-400 to-emerald-600',
            textColor: 'text-white',
        },
        moderate: {
            emoji: '⚠️',
            label: 'Mar Moderado',
            description: 'Atenção para banhistas iniciantes',
            bg: 'from-amber-400 to-amber-600',
            textColor: 'text-white',
        },
        rough: {
            emoji: '⛔',
            label: 'Mar Agitado',
            description: 'Cuidado! Ondas fortes',
            bg: 'from-red-400 to-red-600',
            textColor: 'text-white',
        },
    }[condition];

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={cn(
                "rounded-2xl p-5 bg-gradient-to-r shadow-lg",
                conditionConfig.bg,
                conditionConfig.textColor,
                className
            )}
        >
            <div className="flex items-center justify-between">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <span className="text-2xl">{conditionConfig.emoji}</span>
                        <h3 className="text-xl font-bold">{conditionConfig.label}</h3>
                    </div>
                    <p className="text-white/90 text-sm">{conditionConfig.description}</p>
                </div>
                <AnimatedWaveIcon height={waveHeight} condition={condition} />
            </div>

            <div className="grid grid-cols-3 gap-3 mt-4">
                <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold">{waveHeight.toFixed(1)}m</div>
                    <div className="text-xs text-white/80">Altura</div>
                </div>
                <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                    <div className="text-2xl font-bold">{wavePeriod.toFixed(0)}s</div>
                    <div className="text-xs text-white/80">Período</div>
                </div>
                {seaTemp !== undefined && (
                    <div className="bg-white/20 rounded-xl p-3 text-center backdrop-blur-sm">
                        <div className="text-2xl font-bold">{Math.round(seaTemp)}°C</div>
                        <div className="text-xs text-white/80">Água</div>
                    </div>
                )}
            </div>
        </motion.div>
    );
}

export default ExplainableMetric;
