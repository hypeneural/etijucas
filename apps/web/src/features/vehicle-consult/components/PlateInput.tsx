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
    // If 5th char is a letter (A-Z), it's Mercosul
    if (/[A-Z]/.test(fifthChar)) return "mercosul";
    // If it's a number, it's old format
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

    if (position <= 2) return isLetter; // 0-2: letters
    if (position === 3) return isNumber; // 3: number
    if (position === 4) return isLetter || isNumber; // 4: letter OR number
    if (position >= 5) return isNumber; // 5-6: numbers
    return false;
}

// Get slot type for styling
function getSlotType(position: number, mode: PlateMode): "letter" | "number" | "flex" {
    if (position <= 2) return "letter";
    if (position === 3) return "number";
    if (position === 4) {
        if (mode === "mercosul") return "letter";
        if (mode === "old") return "number";
        return "flex"; // unknown
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

            // Haptic feedback
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

        // Check if user tried to type an invalid character
        if (e.target.value.length > value.length) {
            const attemptedChar = e.target.value.toUpperCase().slice(-1);
            const nextPosition = value.length;

            if (!isCharValidAtPosition(attemptedChar, nextPosition) && /[A-Z0-9]/.test(attemptedChar)) {
                // Flash the current slot red
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

        // Visual feedback for paste
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

    // Header content based on mode
    const renderHeader = () => {
        if (plateMode === "old") {
            return (
                <div className="h-8 bg-gradient-to-b from-slate-300 via-slate-200 to-slate-300 flex items-center justify-between px-3 relative z-10 border-b border-slate-400/50 transition-all duration-300">
                    {/* Old plate style - silver/gray with state */}
                    <span className="text-slate-600 font-bold text-[10px] tracking-[0.15em]">SC · TIJUCAS</span>
                    {/* Fake screws */}
                    <div className="absolute left-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400 shadow-inner"></div>
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-1.5 rounded-full bg-slate-400 shadow-inner"></div>
                </div>
            );
        }

        // Mercosul or Unknown (show Mercosul style by default)
        return (
            <div className={cn(
                "h-10 flex items-center justify-between px-3 relative z-10 border-b transition-all duration-300",
                plateMode === "mercosul"
                    ? "bg-[#1e40af] border-[#172554]"
                    : "bg-[#1e40af]/80 border-[#172554]/80"
            )}>
                {/* LEFT: Mercosul Flag (CSS) */}
                <div className="flex items-center gap-1.5">
                    {/* Mercosul flag: Blue with 4 stars (Southern Cross) */}
                    <div className="w-6 h-4 bg-[#00247d] rounded-[2px] overflow-hidden relative border border-white/20 shadow-sm">
                        {/* Simplified 4 stars for Southern Cross */}
                        <div className="absolute top-[2px] left-[3px] w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="absolute top-[6px] left-[9px] w-[4px] h-[4px] bg-white rounded-full"></div>
                        <div className="absolute top-[10px] left-[3px] w-[3px] h-[3px] bg-white rounded-full"></div>
                        <div className="absolute top-[6px] left-[16px] w-[3px] h-[3px] bg-white rounded-full"></div>
                    </div>
                    <span className="text-white/60 font-bold text-[8px] tracking-[0.1em]">MERCOSUL</span>
                </div>

                {/* CENTER: BRASIL text */}
                <span className={cn(
                    "text-white font-bold text-xs tracking-[0.25em] drop-shadow-sm transition-all duration-300 absolute left-1/2 -translate-x-1/2",
                    plateMode === "mercosul" ? "opacity-100" : "opacity-70"
                )}>BRASIL</span>

                {/* RIGHT: Brazil Flag (CSS) */}
                <div className="flex items-center gap-1.5">
                    {/* Brazilian flag: Green bg, yellow diamond, blue circle */}
                    <div className="w-6 h-4 bg-[#009c3b] rounded-[2px] overflow-hidden relative border border-white/20 shadow-sm">
                        {/* Yellow diamond */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-4 h-3 bg-[#ffdf00] rotate-45 scale-[0.7]"></div>
                        </div>
                        {/* Blue circle */}
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-[8px] h-[8px] bg-[#002776] rounded-full"></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    return (
        <div className="w-full relative group">

            {/* HUD Overlay Container (Visible on Focus/Typing) */}
            <div className={cn(
                "absolute -inset-4 border rounded-2xl transition-all duration-300 pointer-events-none z-0",
                isFocused ? "border-blue-500/30" : "border-transparent"
            )}>
                {/* Corner Accents */}
                <div className={cn("absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>
                <div className={cn("absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-blue-400 transition-opacity duration-300", isFocused ? "opacity-100" : "opacity-0")}></div>

                {/* HUD Label */}
                <div className={cn(
                    "absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-mono font-bold text-blue-400 tracking-widest transition-all duration-300 flex items-center gap-2",
                    isFocused ? "opacity-100" : "opacity-0"
                )}>
                    <ScanLine className="w-3 h-3 animate-pulse" />
                    SCAN MODE
                </div>
            </div>

            <div
                className={cn(
                    "relative w-full rounded-xl overflow-hidden shadow-lg transition-all duration-300 transform z-10",
                    isFocused ? "scale-[1.02]" : "scale-100",
                    justPasted ? "animate-[snap_0.3s_ease-out]" : "",
                    isValid
                        ? "shadow-[0_0_30px_rgba(34,197,94,0.3)] ring-2 ring-green-500 border-green-500"
                        : hasError
                            ? "shadow-[0_0_30px_rgba(239,68,68,0.3)] ring-2 ring-red-500 border-red-500 animate-[shake_0.5s_ease-in-out]"
                            : plateMode === "old"
                                ? "shadow-slate-500/30 border border-slate-400"
                                : "shadow-slate-900/20 border border-slate-700/50",
                    isLoading ? "animate-pulse" : ""
                )}
            >
                {/* Dynamic Header */}
                {renderHeader()}

                {/* Plate Body with Slots */}
                <div
                    className={cn(
                        "h-24 flex items-center justify-center relative cursor-text overflow-hidden transition-all duration-300",
                        plateMode === "old"
                            ? "bg-gradient-to-b from-slate-200 via-slate-100 to-slate-200"
                            : "bg-white"
                    )}
                    onClick={() => inputRef.current?.focus()}
                >
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

                    {/* 7 Slots Display */}
                    <div className="relative z-10 flex items-center gap-1 sm:gap-1.5 px-2">
                        {chars.map((char, index) => {
                            const isFilled = char.trim() !== "";
                            const isCurrentSlot = value.length === index;
                            const slotType = getSlotType(index, plateMode);
                            const isFlashing = flashSlot === index;
                            const isAfterSeparator = index === 3;

                            return (
                                <React.Fragment key={index}>
                                    {/* Separator dot after 3rd character */}
                                    {isAfterSeparator && (
                                        <div className="w-2 h-2 rounded-full bg-slate-400 mx-0.5 sm:mx-1"></div>
                                    )}

                                    <div
                                        className={cn(
                                            "w-9 h-14 sm:w-11 sm:h-16 rounded-lg flex items-center justify-center text-2xl sm:text-3xl font-bold font-mono uppercase transition-all duration-200 relative",
                                            // Background states
                                            isFilled
                                                ? isValid
                                                    ? "bg-green-500/10 text-slate-900"
                                                    : "bg-slate-100 text-slate-900"
                                                : isCurrentSlot && isFocused
                                                    ? "bg-blue-500/10 border-2 border-blue-500/50"
                                                    : "bg-slate-100/50 border-2 border-dashed border-slate-300",
                                            // Slot type indicator
                                            !isFilled && !isCurrentSlot && slotType === "letter" && "border-blue-200",
                                            !isFilled && !isCurrentSlot && slotType === "number" && "border-amber-200",
                                            !isFilled && !isCurrentSlot && slotType === "flex" && "border-purple-200",
                                            // Flash error
                                            isFlashing && "!bg-red-500/20 !border-red-500 animate-[shake_0.3s_ease-in-out]",
                                            // Success glow on valid
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

                                        {/* Cursor blink for current slot */}
                                        {isCurrentSlot && isFocused && !isFilled && (
                                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-0.5 bg-blue-500 animate-pulse rounded-full"></div>
                                        )}
                                    </div>
                                </React.Fragment>
                            );
                        })}
                    </div>

                    {/* Loading Scan Effect */}
                    {isLoading && (
                        <div className="absolute inset-0 z-10 overflow-hidden pointer-events-none">
                            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50 shadow-[0_0_15px_rgba(59,130,246,0.5)] animate-[scan-y_1.5s_linear_infinite]"></div>
                        </div>
                    )}

                    {/* Chrome shine effect for old plates */}
                    {plateMode === "old" && (
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="absolute -left-full top-0 w-1/2 h-full bg-gradient-to-r from-transparent via-white/30 to-transparent skew-x-12 animate-[shine_3s_ease-in-out_infinite]"></div>
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
            </div>

            {/* Format Badge + Hint Area */}
            <div className="mt-3 text-center min-h-[24px] space-y-1">
                {/* Error Message */}
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

                {/* Format Preview Tabs (when unknown and has some input) */}
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
