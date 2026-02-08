/**
 * WeatherCharts - Gráficos interativos mobile-first
 * Touch-optimized, tap-to-explain, visual and intuitive
 */

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Icon } from '@iconify/react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { haptic } from '@/hooks/useHaptic';
import type { WeatherHourPoint } from '@/types/weather';
import { extractHourFromLocalIso } from '@/lib/timezone';

// ======================================================
// Temperature + Rain Chart
// ======================================================

interface TempRainChartProps {
    hours: WeatherHourPoint[];
    className?: string;
}

export function TempRainChart({ hours, className }: TempRainChartProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
    const chartRef = useRef<HTMLDivElement>(null);

    // Get min/max for scaling
    const temps = hours.map(h => h.temp_c);
    const minTemp = Math.floor(Math.min(...temps) - 2);
    const maxTemp = Math.ceil(Math.max(...temps) + 2);
    const tempRange = maxTemp - minTemp;

    // Rain max for scaling bars
    const maxRain = Math.max(...hours.map(h => h.rain_prob_pct ?? 0), 30);

    const handleTouch = useCallback((index: number) => {
        haptic('selection');
        setSelectedIndex(selectedIndex === index ? null : index);
    }, [selectedIndex]);

    const getYPosition = (temp: number) => {
        return 100 - ((temp - minTemp) / tempRange) * 100;
    };

    return (
        <Card className={cn("p-4 overflow-hidden", className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="mdi:thermometer" className="h-4 w-4 text-orange-500" />
                    Temperatura & Chuva
                </h3>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-0.5 bg-orange-500 rounded" />
                        Temp
                    </span>
                    <span className="flex items-center gap-1">
                        <span className="w-3 h-3 bg-blue-400/60 rounded" />
                        Chuva
                    </span>
                </div>
            </div>

            {/* Chart container */}
            <div
                ref={chartRef}
                className="relative h-32 mt-4"
            >
                {/* Rain bars (background) */}
                <div className="absolute inset-0 flex items-end gap-0.5">
                    {hours.slice(0, 24).map((hour, idx) => {
                        const rainHeight = ((hour.rain_prob_pct ?? 0) / maxRain) * 100;
                        return (
                            <motion.div
                                key={`rain-${idx}`}
                                initial={{ height: 0 }}
                                animate={{ height: `${rainHeight}%` }}
                                transition={{ delay: idx * 0.02 }}
                                onClick={() => handleTouch(idx)}
                                className={cn(
                                    "flex-1 rounded-t cursor-pointer transition-colors",
                                    selectedIndex === idx
                                        ? "bg-blue-500"
                                        : "bg-blue-400/40 hover:bg-blue-400/60"
                                )}
                            />
                        );
                    })}
                </div>

                {/* Temperature line (SVG) */}
                <svg
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    viewBox={`0 0 ${hours.slice(0, 24).length * 10} 100`}
                    preserveAspectRatio="none"
                >
                    {/* Temperature gradient fill */}
                    <defs>
                        <linearGradient id="tempGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                            <stop offset="0%" stopColor="rgb(249, 115, 22)" stopOpacity="0.3" />
                            <stop offset="100%" stopColor="rgb(249, 115, 22)" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* Area fill */}
                    <path
                        d={`
                            M 0 ${getYPosition(hours[0].temp_c)}
                            ${hours.slice(0, 24).map((h, i) =>
                            `L ${i * 10 + 5} ${getYPosition(h.temp_c)}`
                        ).join(' ')}
                            L ${(hours.slice(0, 24).length - 1) * 10 + 5} 100
                            L 0 100
                            Z
                        `}
                        fill="url(#tempGradient)"
                    />

                    {/* Temperature line */}
                    <path
                        d={`
                            M 0 ${getYPosition(hours[0].temp_c)}
                            ${hours.slice(0, 24).map((h, i) =>
                            `L ${i * 10 + 5} ${getYPosition(h.temp_c)}`
                        ).join(' ')}
                        `}
                        fill="none"
                        stroke="rgb(249, 115, 22)"
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Temperature dots */}
                    {hours.slice(0, 24).map((h, i) => (
                        <circle
                            key={`dot-${i}`}
                            cx={i * 10 + 5}
                            cy={getYPosition(h.temp_c)}
                            r={selectedIndex === i ? 4 : 2}
                            fill={selectedIndex === i ? "rgb(249, 115, 22)" : "white"}
                            stroke="rgb(249, 115, 22)"
                            strokeWidth="1.5"
                        />
                    ))}
                </svg>

                {/* Tap targets (invisible) */}
                <div className="absolute inset-0 flex">
                    {hours.slice(0, 24).map((_, idx) => (
                        <div
                            key={`tap-${idx}`}
                            onClick={() => handleTouch(idx)}
                            className="flex-1 cursor-pointer"
                        />
                    ))}
                </div>
            </div>

            {/* Hour labels */}
            <div className="flex mt-2">
                {hours.slice(0, 24).filter((_, i) => i % 4 === 0).map((hour, idx) => {
                    return (
                        <div key={idx} className="flex-1 text-center text-xs text-muted-foreground">
                            {extractHourFromLocalIso(hour.t)}h
                        </div>
                    );
                })}
            </div>

            {/* Selected point tooltip */}
            <AnimatePresence>
                {selectedIndex !== null && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 10 }}
                        className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl"
                    >
                        <ChartTooltip hour={hours[selectedIndex]} />
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

function ChartTooltip({ hour }: { hour: WeatherHourPoint }) {
    return (
        <div className="grid grid-cols-4 gap-3 text-center">
            <div>
                <div className="text-xs text-muted-foreground">Hora</div>
                <div className="font-semibold">{extractHourFromLocalIso(hour.t)}:00</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Temp</div>
                <div className="font-semibold text-orange-500">{Math.round(hour.temp_c)}°</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Chuva</div>
                <div className="font-semibold text-blue-500">{hour.rain_prob_pct ?? 0}%</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Vento</div>
                <div className="font-semibold">{Math.round(hour.wind_kmh)} km/h</div>
            </div>
        </div>
    );
}

// ======================================================
// Wind Direction Chart
// ======================================================

interface WindChartProps {
    hours: WeatherHourPoint[];
    className?: string;
}

export function WindChart({ hours, className }: WindChartProps) {
    const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

    // Max wind for scaling
    const maxWind = Math.max(...hours.map(h => h.wind_kmh), 30);

    const handleTouch = useCallback((index: number) => {
        haptic('selection');
        setSelectedIndex(selectedIndex === index ? null : index);
    }, [selectedIndex]);

    // Direction arrow component
    const WindArrow = ({ deg, size = 16 }: { deg: number; size?: number }) => (
        <motion.div
            initial={{ rotate: 0 }}
            animate={{ rotate: deg }}
            style={{ width: size, height: size }}
            className="flex items-center justify-center"
        >
            <Icon
                icon="mdi:arrow-down"
                style={{ width: size, height: size }}
                className="text-cyan-500"
            />
        </motion.div>
    );

    return (
        <Card className={cn("p-4", className)}>
            <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold flex items-center gap-2">
                    <Icon icon="mdi:weather-windy" className="h-4 w-4 text-cyan-500" />
                    Vento & Direção
                </h3>
                <ExplainButton
                    title="O que são rajadas?"
                    message="Rajadas são picos momentâneos de velocidade do vento, geralmente 30-50% mais fortes que o vento médio. São causadas por turbulência atmosférica e podem ser perigosas para atividades ao ar livre."
                    tip="Rajadas acima de 50 km/h requerem cuidado!"
                />
            </div>

            {/* Horizontal scroll wind chart */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {hours.slice(0, 24).map((hour, idx) => {
                    const windHeight = (hour.wind_kmh / maxWind) * 100;
                    const isSelected = selectedIndex === idx;
                    const isStrong = hour.wind_kmh >= 30 || (hour.gust_kmh ?? 0) >= 50;

                    return (
                        <motion.div
                            key={idx}
                            onClick={() => handleTouch(idx)}
                            whileTap={{ scale: 0.95 }}
                            className={cn(
                                "flex-shrink-0 flex flex-col items-center p-2 rounded-xl cursor-pointer transition-colors min-w-[60px]",
                                isSelected
                                    ? "bg-cyan-100 dark:bg-cyan-900/40"
                                    : "bg-gray-50 dark:bg-gray-800",
                                isStrong && "ring-2 ring-amber-400"
                            )}
                        >
                            {/* Time */}
                            <div className="text-xs text-muted-foreground mb-1">
                                {extractHourFromLocalIso(hour.t)}h
                            </div>

                            {/* Wind arrow */}
                            <WindArrow deg={hour.wind_dir_deg} size={20} />

                            {/* Wind speed bar */}
                            <div className="w-3 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden mt-1">
                                <motion.div
                                    initial={{ height: 0 }}
                                    animate={{ height: `${windHeight}%` }}
                                    className={cn(
                                        "w-full rounded-full",
                                        hour.wind_kmh >= 30
                                            ? "bg-amber-500"
                                            : hour.wind_kmh >= 15
                                                ? "bg-cyan-400"
                                                : "bg-cyan-300"
                                    )}
                                    style={{ marginTop: `${100 - windHeight}%` }}
                                />
                            </div>

                            {/* Speed */}
                            <div className={cn(
                                "text-xs font-semibold mt-1",
                                hour.wind_kmh >= 30 ? "text-amber-500" : "text-foreground"
                            )}>
                                {Math.round(hour.wind_kmh)}
                            </div>
                        </motion.div>
                    );
                })}
            </div>

            {/* Selected detail */}
            <AnimatePresence>
                {selectedIndex !== null && hours[selectedIndex] && (
                    <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-xl">
                            <WindTooltip hour={hours[selectedIndex]} />
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </Card>
    );
}

function WindTooltip({ hour }: { hour: WeatherHourPoint }) {
    const direction = getDirectionLabel(hour.wind_dir_deg);

    return (
        <div className="grid grid-cols-4 gap-2 text-center">
            <div>
                <div className="text-xs text-muted-foreground">Hora</div>
                <div className="font-semibold">{extractHourFromLocalIso(hour.t)}:00</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Vento</div>
                <div className="font-semibold text-cyan-500">{Math.round(hour.wind_kmh)} km/h</div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Rajadas</div>
                <div className={cn(
                    "font-semibold",
                    (hour.gust_kmh ?? 0) >= 50 ? "text-amber-500" : "text-foreground"
                )}>
                    {Math.round(hour.gust_kmh ?? 0)} km/h
                </div>
            </div>
            <div>
                <div className="text-xs text-muted-foreground">Direção</div>
                <div className="font-semibold">{direction}</div>
            </div>
        </div>
    );
}

function getDirectionLabel(deg: number): string {
    const directions = ['N', 'NE', 'L', 'SE', 'S', 'SO', 'O', 'NO'];
    const index = Math.round(deg / 45) % 8;
    return directions[index];
}

// ======================================================
// Explain Button with Modal
// ======================================================

interface ExplainButtonProps {
    title: string;
    message: string;
    tip?: string;
}

function ExplainButton({ title, message, tip }: ExplainButtonProps) {
    const [isOpen, setIsOpen] = useState(false);

    const handleOpen = () => {
        haptic('light');
        setIsOpen(true);
    };

    return (
        <>
            <button
                onClick={handleOpen}
                className="text-xs text-primary flex items-center gap-1 hover:underline"
            >
                <Icon icon="mdi:help-circle-outline" className="h-4 w-4" />
                Entenda
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />

                        {/* Modal */}
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 bottom-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl z-50 max-w-md mx-auto"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Icon icon="mdi:lightbulb-outline" className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-2">{title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">
                                        {message}
                                    </p>
                                    {tip && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                                            <span className="text-xs text-amber-800 dark:text-amber-200">
                                                💡 {tip}
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-4 w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                            >
                                Entendi
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

// ======================================================
// Weather Explainer Tooltips (for detailed mode)
// ======================================================

export function WeatherExplainers() {
    return (
        <Card className="p-4">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                <Icon icon="mdi:school-outline" className="h-4 w-4" />
                Entenda os termos
            </h3>
            <div className="grid grid-cols-2 gap-2">
                <ExplainChip
                    icon="mdi:weather-windy-variant"
                    label="Rajadas"
                    title="O que são rajadas?"
                    message="Rajadas são picos momentâneos de velocidade do vento, geralmente 30-50% mais fortes que o vento médio. São causadas por turbulência atmosférica."
                    tip="Rajadas acima de 50 km/h são perigosas"
                />
                <ExplainChip
                    icon="mdi:timer-outline"
                    label="Período"
                    title="O que é período da onda?"
                    message="O período é o tempo entre uma onda e outra (em segundos). Quanto maior o período, mais energia a onda carrega e mais forte ela chega à praia."
                    tip="Período > 10s = ondas fortes"
                />
                <ExplainChip
                    icon="mdi:waves"
                    label="Swell"
                    title="O que é swell?"
                    message="Swell são ondas que viajaram de longe, geradas por tempestades distantes no oceano. Chegam organizadas, com mais energia e maiores que as ondas locais."
                    tip="Swell grande mesmo sem vento local = mar forte"
                />
                <ExplainChip
                    icon="mdi:weather-sunny-alert"
                    label="Índice UV"
                    title="O que é índice UV?"
                    message="O índice UV mede a intensidade da radiação ultravioleta do sol. Valores acima de 6 requerem proteção solar, acima de 11 é extremo."
                    tip="UV > 8: use protetor, chapéu e óculos"
                />
            </div>
        </Card>
    );
}

function ExplainChip({
    icon,
    label,
    title,
    message,
    tip
}: {
    icon: string;
    label: string;
    title: string;
    message: string;
    tip: string;
}) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <>
            <button
                onClick={() => { haptic('light'); setIsOpen(true); }}
                className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-left"
            >
                <Icon icon={icon} className="h-5 w-5 text-primary" />
                <span className="text-sm">{label}</span>
                <Icon icon="mdi:help-circle-outline" className="h-4 w-4 text-muted-foreground ml-auto" />
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
                        />
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95, y: 20 }}
                            animate={{ opacity: 1, scale: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95, y: 20 }}
                            className="fixed left-4 right-4 bottom-4 bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-2xl z-50 max-w-md mx-auto"
                        >
                            <div className="flex items-start gap-3">
                                <div className="p-2 rounded-full bg-primary/10">
                                    <Icon icon={icon} className="h-5 w-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-semibold mb-2">{title}</h3>
                                    <p className="text-sm text-muted-foreground mb-3">{message}</p>
                                    {tip && (
                                        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-2">
                                            <span className="text-xs text-amber-800 dark:text-amber-200">💡 {tip}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="mt-4 w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl font-medium"
                            >
                                Entendi
                            </button>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}

export default TempRainChart;
