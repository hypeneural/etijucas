/**
 * PresetChips - Chips de preset para atividades
 * "Vou sair", "Praia", "Pescar", "Trilha"
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { InsightsPanel } from './InsightsPanel';
import { useWeatherPreset } from '@/services/weather.service';
import { PRESET_INFO, type PresetType } from '@/types/weather';

interface PresetChipsProps {
    className?: string;
}

const presetTypes: PresetType[] = ['going_out', 'beach', 'fishing', 'hiking'];

export function PresetChips({ className }: PresetChipsProps) {
    const [selected, setSelected] = useState<PresetType | null>(null);

    return (
        <div className={className}>
            {/* Chips row */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {presetTypes.map((type) => {
                    const info = PRESET_INFO[type];
                    const isSelected = selected === type;

                    return (
                        <motion.button
                            key={type}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => setSelected(isSelected ? null : type)}
                            className={cn(
                                "flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all",
                                isSelected
                                    ? "bg-primary text-primary-foreground shadow-lg"
                                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                            )}
                        >
                            <Icon icon={info.icon} className="h-4 w-4" />
                            {info.title}
                        </motion.button>
                    );
                })}
            </div>

            {/* Selected preset content */}
            <AnimatePresence mode="wait">
                {selected && (
                    <PresetContent key={selected} type={selected} onClose={() => setSelected(null)} />
                )}
            </AnimatePresence>
        </div>
    );
}

// ======================================================
// Preset Content Component
// ======================================================

function PresetContent({ type, onClose }: { type: PresetType; onClose: () => void }) {
    const { data, isLoading, error } = useWeatherPreset(type);
    const info = PRESET_INFO[type];

    return (
        <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
        >
            <Card className="mt-4 p-4 border-2 border-primary/20">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Icon icon={info.icon} className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold">{data?.preset?.title ?? info.title}</h3>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-muted-foreground hover:text-foreground"
                    >
                        <Icon icon="mdi:close" className="h-5 w-5" />
                    </button>
                </div>

                {isLoading ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Icon icon="mdi:loading" className="h-8 w-8 mx-auto animate-spin" />
                        <p className="mt-2">Carregando...</p>
                    </div>
                ) : error ? (
                    <div className="py-8 text-center text-muted-foreground">
                        <Icon icon="mdi:alert" className="h-8 w-8 mx-auto" />
                        <p className="mt-2">Erro ao carregar</p>
                    </div>
                ) : data?.preset?.insights ? (
                    <InsightsPanel insights={data.preset.insights} />
                ) : (
                    <p className="text-muted-foreground">Nenhum insight disponível</p>
                )}

                {/* Focus tags */}
                {data?.preset?.focus && (
                    <div className="mt-4 flex gap-2 flex-wrap">
                        {data.preset.focus.map((f, i) => (
                            <span
                                key={i}
                                className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full"
                            >
                                {f}
                            </span>
                        ))}
                    </div>
                )}
            </Card>
        </motion.div>
    );
}

export default PresetChips;
