import React, { useRef, useLayoutEffect } from "react";
import { normalizePlate, formatPlateVisual } from "@/domain/vehicle/plate";
import { cn } from "@/lib/utils"; // Assuming utils exists

interface PlateInputProps {
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    isValid?: boolean;
}

export const PlateInput: React.FC<PlateInputProps> = ({
    value,
    onChange,
    isLoading = false,
    isValid = false,
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

    // Focus input on mount if empty? Maybe not to avoid keyboard popping up unexpectedly.

    return (
        <div className="w-full relative group">
            <div
                className={cn(
                    "relative w-full rounded-xl overflow-hidden shadow-lg transition-transform duration-300 transform group-focus-within:scale-[1.02]",
                    isValid ? "shadow-green-500/20 ring-2 ring-green-500/50" : "shadow-slate-900/10",
                    isLoading ? "animate-pulse" : ""
                )}
            >
                {/* Plate Top (Blue Bar) */}
                <div className="h-10 bg-[#1e40af] flex items-center justify-between px-3 relative z-10 border-b border-[#172554]">
                    {/* Mercosul Flag Placeholder - using basic css or image if available */}
                    <div className="flex items-center gap-1">
                        <div className="w-5 h-3 bg-white/20 rounded-sm overflow-hidden relative">
                            {/* Micro flag representation */}
                            <div className="absolute inset-0 bg-blue-800"></div>
                        </div>
                        <span className="text-white font-bold text-[10px] tracking-widest">BRASIL</span>
                    </div>

                    <div className="flex items-center gap-1">
                        <div className="w-4 h-3 bg-green-500/80 rounded-[1px]"></div>
                    </div>
                </div>

                {/* Plate Body (White/Input Area) */}
                <div className="bg-white h-20 flex items-center justify-center relative cursor-text text-slate-900" onClick={() => inputRef.current?.focus()}>

                    {/* Hidden real input for keyboard handling */}
                    <input
                        ref={inputRef}
                        type="text"
                        inputMode="text" /* or text to allow letters */
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
                    <div className="text-4xl sm:text-5xl font-bold uppercase tracking-[0.15em] font-mono flex items-center justify-center w-full text-center select-none pointer-events-none">
                        {/* If empty, show placeholder or just blank */}
                        {value.length === 0 ? (
                            <span className="text-slate-200 opacity-50">ABC·1234</span>
                        ) : (
                            <span className={cn("transition-all duration-200", isValid ? "text-slate-900" : "text-slate-800")}>
                                {displayValue}
                            </span>
                        )}
                    </div>

                    {/* Loading Scan Effect */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-500/30 blur-md animate-[scan_1.5s_ease-in-out_infinite]"></div>
                        </div>
                    )}

                    {/* Validity Indicator (Optional checkmark) */}
                    {isValid && !isLoading && (
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500 animate-in fade-in zoom-in duration-300">
                            <span className="material-symbols-outlined text-2xl">check_circle</span>
                        </div>
                    )}

                </div>
            </div>

            {/* Helper text - visually hidden but could be useful */}
            <div className="sr-only">Digite a placa do veículo</div>
        </div>
    );
};
