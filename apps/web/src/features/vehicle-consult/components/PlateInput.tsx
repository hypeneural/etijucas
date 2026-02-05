import React, { useRef } from "react";
import { normalizePlate, formatPlateVisual } from "@/domain/vehicle/plate";
import { cn } from "@/lib/utils";
import { LoaderCircle, BadgeCheck, TriangleAlert, ScanLine } from "lucide-react";

interface PlateInputProps {
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    isValid?: boolean;
    hasError?: boolean;
    errorMessage?: string;
}

export const PlateInput: React.FC<PlateInputProps> = ({
    value,
    onChange,
    isLoading = false,
    isValid = false,
    hasError = false,
    errorMessage,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        // Get raw value
        const raw = e.target.value;
        // Normalize immediately (uppercase, alphanumeric only)
        const normalized = normalizePlate(raw);

        // Limit to 7 chars
        if (normalized.length <= 7) {
            onChange(normalized);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const normalized = normalizePlate(pastedData).slice(0, 7);
        onChange(normalized);
    };

    // Visual format for display (e.g., ABC·1D23)
    const displayValue = formatPlateVisual(value);
    // Focus input on mount
    React.useEffect(() => {
        // Optional: Auto-focus if needed, but might be annoying on mobile.
        // inputRef.current?.focus();
    }, []);

    // Haptic feedback on Valid
    React.useEffect(() => {
        if (isValid && !isLoading) {
            if (navigator.vibrate) navigator.vibrate(50);
        }
    }, [isValid, isLoading]);

    return (
        <div className="w-full relative group">

            {/* HUD Overlay Container (Visible on Focus/Typing) */}
            <div className="absolute -inset-4 border border-blue-500/0 group-focus-within:border-blue-500/30 rounded-2xl transition-all duration-300 pointer-events-none z-0">
                {/* Corner Accents */}
                <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 opacity-0 group-focus-within:opacity-100 transition-opacity duration-300"></div>

                {/* HUD Label */}
                <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-blue-400 tracking-widest opacity-0 group-focus-within:opacity-100 transition-all duration-300 flex items-center gap-2">
                    <ScanLine className="w-3 h-3 animate-pulse" />
                    SCAN MODE
                </div>
            </div>

            <div
                className={cn(
                    "relative w-full rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform group-focus-within:scale-[1.02] z-10",
                    isValid
                        ? "shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-2 ring-green-500 border-green-500"
                        : hasError
                            ? "shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-2 ring-red-500 border-red-500 animate-[shake_0.5s_ease-in-out]"
                            : "shadow-slate-900/20 border border-slate-700/50 group-focus-within:border-blue-500/50 group-focus-within:shadow-blue-500/20",
                    isLoading ? "animate-pulse" : ""
                )}
            >
                {/* Plate Top (Blue Bar) */}
                <div className="h-10 bg-[#1e40af] flex items-center justify-between px-3 relative z-10 border-b border-[#172554]">
                    {/* Mercosul Flag */}
                    <div className="flex items-center gap-1.5">
                        <div className="w-6 h-4 bg-blue-900 rounded-[2px] overflow-hidden relative border border-white/10 shadow-sm">
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-full h-[50%] bg-green-600/20 rotate-45 transform scale-150"></div>
                            </div>
                        </div>
                        <span className="text-white font-bold text-[10px] tracking-[0.2em] drop-shadow-sm">BRASIL</span>
                    </div>

                    <div className="flex items-center gap-1 opacity-80">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/2/20/Mercosul_flag.svg" className="w-4 h-4 opacity-50" alt="Mercosul" />
                    </div>
                </div>

                {/* Plate Body (White/Input Area) */}
                <div className="bg-white h-24 flex items-center justify-center relative cursor-text text-slate-900 overflow-hidden" onClick={() => inputRef.current?.focus()}>

                    {/* Hidden real input */}
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="text"
                        className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                        value={value}
                        onChange={handleChange}
                        onPaste={handlePaste}
                        autoComplete="off"
                        autoCorrect="off"
                        autoCapitalize="characters"
                        spellCheck="false"
                    />

                    {/* Visual Display */}
                    <div className="relative z-10 w-full text-center">
                        <div className={cn(
                            "text-5xl sm:text-6xl font-bold uppercase tracking-[0.1em] font-mono flex items-center justify-center select-none transition-all duration-300",
                            value.length === 0 ? "opacity-30 scale-95 blur-[1px]" : "opacity-100 scale-100"
                        )}>
                            {/* If empty, show placeholder */}
                            {value.length === 0 ? (
                                <span className="text-slate-300">ABC1234</span>
                            ) : (
                                <span className={cn("transition-colors duration-200", isValid ? "text-slate-900" : "text-slate-800")}>
                                    {displayValue}
                                </span>
                            )}
                        </div>
                        {/* Mercosul Waves watermark effect */}
                        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full pointer-events-none opacity-[0.03] bg-[url('https://upload.wikimedia.org/wikipedia/commons/2/20/Mercosul_flag.svg')] bg-center bg-no-repeat bg-contain blur-sm"></div>
                    </div>

                    {/* Loading Scan Effect - HUD Style */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan-y_1.5s_linear_infinite]"></div>
                        </div>
                    )}

                    {/* Validity Indicator */}
                    <div className="absolute right-3 top-3 animate-in fade-in zoom-in duration-300 z-20">
                        {isLoading ? (
                            <LoaderCircle className="w-5 h-5 text-blue-500 animate-spin" />
                        ) : isValid ? (
                            <div className="flex flex-col items-center">
                                <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/30">
                                    <BadgeCheck className="w-5 h-5 text-white" />
                                </div>
                            </div>
                        ) : null}
                    </div>

                </div>
            </div>

            {/* Helper text / Error Message */}
            {errorMessage && hasError && (
                <div className="mt-3 text-center text-sm text-red-400 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                    {errorMessage}
                </div>
            )}
            <div className="sr-only">Digite a placa do veículo</div>
        </div>
    );
};
