import React, { useRef, useState, useEffect, useMemo } from "react";
import { filterPlateByPosition, getPlateHint, isValidPlate } from "@/domain/vehicle/plate";
import { cn } from "@/lib/utils";
import { LoaderCircle, BadgeCheck, ScanLine, Info, TriangleAlert, HelpCircle } from "lucide-react";
import { toast } from "sonner";

interface PlateInputProps {
    value: string;
    onChange: (value: string) => void;
    isLoading?: boolean;
    isValid?: boolean;
    hasError?: boolean;
    errorMessage?: string;
}

type PlateMode = "unknown" | "old" | "mercosul";

// Detect plate mode based on 5th character
function detectPlateMode(plate: string): PlateMode {
    if (plate.length < 5) return "unknown";
    const fifthChar = plate[4];
    if (/[A-Z]/.test(fifthChar)) return "mercosul";
    if (/[0-9]/.test(fifthChar)) return "old";
    return "unknown";
}

// Get placeholder based on mode
function getPlaceholder(mode: PlateMode): string[] {
    switch (mode) {
        case "mercosul": return ["A", "B", "C", "1", "D", "2", "3"];
        case "old": return ["A", "B", "C", "1", "2", "3", "4"];
        default: return ["A", "B", "C", "1", "?", "?", "?"];
    }
}

// Check if character at position is valid
function isCharValidAtPosition(char: string, position: number): boolean {
    if (!char) return true;
    const isLetter = /[A-Z]/.test(char);
    const isNumber = /[0-9]/.test(char);

    if (position <= 2) return isLetter;
    if (position === 3) return isNumber;
    if (position === 4) return isLetter || isNumber;
    if (position >= 5) return isNumber;
    return false;
}

// Get slot type for styling
function getSlotType(position: number, mode: PlateMode): "letter" | "number" | "flex" {
    if (position <= 2) return "letter";
    if (position === 3) return "number";
    if (position === 4) {
        if (mode === "mercosul") return "letter";
        if (mode === "old") return "number";
        return "flex";
    }
    return "number";
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
    const [isFocused, setIsFocused] = useState(false);
    const [lastDetectedMode, setLastDetectedMode] = useState<PlateMode>("unknown");
    const [flashSlot, setFlashSlot] = useState<number | null>(null);
    const [justPasted, setJustPasted] = useState(false);

    // Derive plate mode
    const plateMode = useMemo(() => detectPlateMode(value), [value]);
    const placeholder = useMemo(() => getPlaceholder(plateMode), [plateMode]);
    const chars = value.padEnd(7, " ").split("").slice(0, 7);

    // Detect mode change and show toast
    useEffect(() => {
        if (plateMode !== "unknown" && plateMode !== lastDetectedMode && value.length >= 5) {
            setLastDetectedMode(plateMode);
            const label = plateMode === "mercosul" ? "Mercosul" : "Antiga";
            toast.success(`Placa ${label} detectada`, { duration: 1200, icon: "🚗" });
            if (navigator.vibrate) navigator.vibrate([30, 50, 30]);
        }
    }, [plateMode, lastDetectedMode, value.length]);

    // Reset mode tracking when value is cleared
    useEffect(() => {
        if (value.length < 5) {
            setLastDetectedMode("unknown");
        }
    }, [value.length]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const filtered = filterPlateByPosition(e.target.value);

        if (e.target.value.length > value.length) {
            const attemptedChar = e.target.value.toUpperCase().slice(-1);
            const nextPosition = value.length;

            if (!isCharValidAtPosition(attemptedChar, nextPosition) && /[A-Z0-9]/.test(attemptedChar)) {
                setFlashSlot(nextPosition);
                setTimeout(() => setFlashSlot(null), 400);
                if (navigator.vibrate) navigator.vibrate(50);
            }
        }

        if (filtered.length <= 7) {
            onChange(filtered);
        }
    };

    const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
        e.preventDefault();
        const pastedData = e.clipboardData.getData("text");
        const filtered = filterPlateByPosition(pastedData).slice(0, 7);
        onChange(filtered);

        setJustPasted(true);
        setTimeout(() => setJustPasted(false), 300);
        if (navigator.vibrate) navigator.vibrate([20, 30, 20]);
    };

    // Get dynamic hint
    const hint = useMemo(() => {
        if (isValid || hasError || isLoading) return null;
        const len = value.length;

        if (len === 0) return "Toque para digitar a placa";
        if (len < 3) return "3 letras (ex: ABC)";
        if (len === 3) return "Agora 1 número";
        if (len === 4) return "Letra = Mercosul · Número = Antiga";
        if (len >= 5 && len < 7) return "Últimos 2 números";

        return null;
    }, [value.length, isValid, hasError, isLoading]);

    // Haptic feedback on Valid
    useEffect(() => {
        if (isValid && !isLoading) {
            if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
        }
    }, [isValid, isLoading]);

    // =========================================
    // RENDER SLOTS (7 character boxes)
    // =========================================
    const renderSlots = () => (
        <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 px-2">
            {chars.map((char, index) => {
                const isFilled = char.trim() !== "";
                const isCurrentSlot = value.length === index;
                const slotType = getSlotType(index, plateMode);
                const isFlashing = flashSlot === index;
                const isAfterSeparator = index === 3;

                return (
                    <React.Fragment key={index}>
                        {isAfterSeparator && (
                            <div className="w-2 h-2 rounded-full bg-slate-400 mx-0.5 sm:mx-1"></div>
                        )}

                        <div
                            className={cn(
                                "w-9 h-12 sm:w-10 sm:h-14 rounded-md flex items-center justify-center text-xl sm:text-2xl font-black font-sans uppercase transition-all duration-200 relative",
                                isFilled
                                    ? isValid
                                        ? "bg-green-500/10 text-slate-900"
                                        : plateMode === "old"
                                            ? "bg-slate-200/80 text-slate-900"
                                            : "bg-white text-slate-900"
                                    : isCurrentSlot && isFocused
                                        ? "bg-blue-500/10 border-2 border-blue-500/50"
                                        : "bg-slate-100/50 border-2 border-dashed border-slate-300",
                                !isFilled && !isCurrentSlot && slotType === "letter" && "border-blue-200",
                                !isFilled && !isCurrentSlot && slotType === "number" && "border-amber-200",
                                !isFilled && !isCurrentSlot && slotType === "flex" && "border-purple-200",
                                isFlashing && "!bg-red-500/20 !border-red-500 animate-[shake_0.3s_ease-in-out]",
                                isValid && isFilled && "shadow-[0_0_8px_rgba(34,197,94,0.3)]"
                            )}
                        >
                            {isFilled ? (
                                char
                            ) : (
                                <span className={cn(
                                    "text-slate-300 text-lg",
                                    isCurrentSlot && isFocused && "animate-pulse text-blue-400"
                                )}>
                                    {placeholder[index]}
                                </span>
                            )}

                            {isCurrentSlot && isFocused && !isFilled && (
                                <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-500 animate-pulse rounded-full"></div>
                            )}
                        </div>
                    </React.Fragment>
                );
            })}
        </div>
    );

    return (
        <div className="w-full relative group">

            {/* HUD Overlay (Focus indicator) */}
            <div className={cn(
                "absolute -inset-4 border rounded-2xl transition-all duration-300 pointer-events-none z-0",
                isFocused ? "border-blue-500/30" : "border-transparent"
            )}>
                <div className={cn("absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>

                <div className={cn(
                    "absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-blue-400 tracking-widest transition-all duration-300 flex items-center gap-2",
                    isFocused ? "opacity-100" : "opacity-0"
                )}>
                    <ScanLine className="w-3 h-3 animate-pulse" />
                    SCAN MODE
                </div>
            </div>

            {/* =========================================
                PLATE CONTAINER
            ========================================= */}
            <div
                className={cn(
                    "relative w-full overflow-hidden shadow-lg transition-all duration-300 transform z-10",
                    plateMode === "old" ? "rounded-xl" : "rounded-lg",
                    isFocused ? "scale-[1.02]" : "scale-100",
                    justPasted ? "animate-[snap_0.3s_ease-out]" : "",
                    isValid
                        ? "shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-2 ring-green-500"
                        : hasError
                            ? "shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-2 ring-red-500 animate-[shake_0.5s_ease-in-out]"
                            : plateMode === "old"
                                ? "shadow-slate-400/40 border-2 border-slate-400"
                                : "shadow-slate-900/30 border-2 border-slate-300",
                    isLoading ? "animate-pulse" : ""
                )}
                onClick={() => inputRef.current?.focus()}
            >
                {/* =========================================
                    OLD PLATE LAYOUT (Gray, UF-CIDADE header)
                ========================================= */}
                {plateMode === "old" ? (
                    <div className="bg-gradient-to-b from-[#d8d8d8] via-[#c8c8c8] to-[#b8b8b8] relative">
                        {/* Header with UF-CIDADE */}
                        <div className="h-6 bg-gradient-to-b from-[#f0f0f0] to-[#e0e0e0] flex items-center justify-center relative z-10 border-b border-slate-300">
                            <span className="text-slate-700 font-bold text-[10px] tracking-[0.06em] font-sans">
                                SC-TIJUCAS
                            </span>
                        </div>

                        {/* Body */}
                        <div className="h-16 flex items-center justify-center relative bg-gradient-to-b from-[#e0e0e0] via-[#d8d8d8] to-[#d0d0d0]">
                            {/* Screw holes in corners */}
                            <div className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-slate-500/50 shadow-inner"></div>
                            <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-slate-500/50 shadow-inner"></div>
                            <div className="absolute left-2 bottom-2 w-1.5 h-1.5 rounded-full bg-slate-500/50 shadow-inner"></div>
                            <div className="absolute right-2 bottom-2 w-1.5 h-1.5 rounded-full bg-slate-500/50 shadow-inner"></div>

                            {/* Chrome shine effect */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                                <div className="absolute -left-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/25 to-transparent skew-x-12 animate-[shine_4s_ease-in-out_infinite]"></div>
                            </div>

                            {renderSlots()}
                        </div>
                    </div>
                ) : (
                    /* =========================================
                        MERCOSUL PLATE LAYOUT (Blue header, green BR stripe)
                    ========================================= */
                    <div className="bg-white relative flex">
                        {/* Green side stripe with BR */}
                        <div className="w-7 bg-[#009739] flex flex-col items-center justify-end pb-1.5 relative shrink-0 rounded-l-lg">
                            <span className="text-white font-bold text-[9px] tracking-tight">BR</span>
                        </div>

                        {/* Main plate area */}
                        <div className="flex-1 flex flex-col">
                            {/* Blue header with MERCOSUL + BRASIL + Flag */}
                            <div className={cn(
                                "h-7 flex items-center justify-between px-2 relative z-10 transition-all duration-300",
                                plateMode === "mercosul" ? "bg-[#003399]" : "bg-[#003399]/80"
                            )}>
                                {/* LEFT: MERCOSUL text */}
                                <span className="text-white/70 font-bold text-[6px] tracking-[0.03em] uppercase">MERCOSUL</span>

                                {/* CENTER: BRASIL text */}
                                <span className={cn(
                                    "text-white font-bold text-[10px] tracking-[0.12em] transition-all duration-300 absolute left-1/2 -translate-x-1/2",
                                    plateMode === "mercosul" ? "opacity-100" : "opacity-70"
                                )}>BRASIL</span>

                                {/* RIGHT: Brazil Flag (CSS) */}
                                <div className="w-5 h-3 bg-[#009c3b] rounded-[1px] overflow-hidden relative border border-white/10">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-2 bg-[#ffdf00] rotate-45 scale-[0.55]"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[5px] h-[5px] bg-[#002776] rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* White body */}
                            <div className="h-16 flex items-center justify-center relative bg-white">
                                {renderSlots()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Unknown mode - Default to Mercosul style but dimmed */}
                {plateMode === "unknown" && (
                    <div className="absolute inset-0 bg-white flex" style={{ display: plateMode === "unknown" ? "flex" : "none" }}>
                        <div className="w-7 bg-[#009739]/60 flex flex-col items-center justify-end pb-1.5 shrink-0 rounded-l-lg">
                            <span className="text-white/70 font-bold text-[9px]">BR</span>
                        </div>
                        <div className="flex-1 flex flex-col">
                            <div className="h-7 flex items-center justify-between px-2 bg-[#003399]/60">
                                <span className="text-white/50 font-bold text-[6px] tracking-[0.03em]">MERCOSUL</span>
                                <span className="text-white/60 font-bold text-[10px] tracking-[0.12em] absolute left-1/2 -translate-x-1/2">BRASIL</span>
                                <div className="w-5 h-3 bg-[#009c3b]/60 rounded-[1px] overflow-hidden relative">
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-3 h-2 bg-[#ffdf00]/60 rotate-45 scale-[0.55]"></div>
                                    </div>
                                    <div className="absolute inset-0 flex items-center justify-center">
                                        <div className="w-[5px] h-[5px] bg-[#002776]/60 rounded-full"></div>
                                    </div>
                                </div>
                            </div>
                            <div className="h-16 flex items-center justify-center bg-white/90">
                                {renderSlots()}
                            </div>
                        </div>
                    </div>
                )}

                {/* Hidden real input */}
                <input
                    ref={inputRef}
                    type="text"
                    inputMode="text"
                    className="absolute inset-0 w-full h-full opacity-0 cursor-text z-20"
                    value={value}
                    onChange={handleChange}
                    onPaste={handlePaste}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    autoComplete="off"
                    autoCorrect="off"
                    autoCapitalize="characters"
                    spellCheck="false"
                />

                {/* Loading Scan Effect */}
                {isLoading && (
                    <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                        <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan-y_1.5s_linear_infinite]"></div>
                    </div>
                )}

                {/* Validity Indicator */}
                <div className="absolute right-2 top-2 animate-in fade-in zoom-in duration-300 z-20">
                    {isLoading ? (
                        <LoaderCircle className="w-5 h-5 text-blue-500 animate-spin" />
                    ) : isValid ? (
                        <div className="bg-green-500 rounded-full p-1 shadow-lg shadow-green-500/30">
                            <BadgeCheck className="w-4 h-4 text-white" />
                        </div>
                    ) : null}
                </div>
            </div>

            {/* Format Badge + Hint Area */}
            <div className="mt-3 text-center min-h-[24px] space-y-1">
                {errorMessage && hasError ? (
                    <div className="text-sm text-red-500 font-medium animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-center gap-2">
                        <TriangleAlert className="w-4 h-4" />
                        {errorMessage}
                    </div>
                ) : isValid ? (
                    <div className="text-sm text-green-500 font-medium animate-in fade-in zoom-in duration-300 flex items-center justify-center gap-2">
                        <BadgeCheck className="w-4 h-4" />
                        Placa {plateMode === "mercosul" ? "Mercosul" : "Antiga"} reconhecida
                    </div>
                ) : hint ? (
                    <div className="text-sm text-muted-foreground animate-in fade-in slide-in-from-top-2 duration-300 flex items-center justify-center gap-2">
                        <Info className="w-4 h-4 text-blue-400" />
                        {hint}
                    </div>
                ) : null}

                {plateMode === "unknown" && value.length >= 1 && value.length < 5 && (
                    <div className="flex items-center justify-center gap-2 mt-2 animate-in fade-in duration-300">
                        <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-slate-200/50 border border-slate-300/50">
                            Antiga
                        </span>
                        <span className="text-[10px] text-slate-400">ou</span>
                        <span className="text-[10px] text-slate-500 font-medium px-2 py-0.5 rounded-full bg-blue-100/50 border border-blue-300/50">
                            Mercosul
                        </span>
                    </div>
                )}
            </div>

            <div className="sr-only">Digite a placa do veículo</div>
        </div>
    );
};
