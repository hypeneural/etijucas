import React, { useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

export type TiquinhoState =
    | "greeting"
    | "idle"
    | "plate_valid"
    | "loading_vehicle"
    | "data_loaded"
    | "error"
    | "ocr_analyzing"
    | "ocr_success";

interface TiquinhoAssistantProps {
    state: TiquinhoState;
    customMessage?: string;
    isSticky?: boolean;
    className?: string;
}

const MESSAGES: Record<TiquinhoState, string> = {
    greeting: "Olá! Sou o Tiquinho, o Atendente do Despachante Titico de Tijucas/SC! 👋",
    idle: "Digite a placa que eu te mostro as datas rapidinho! 🚗",
    plate_valid: "Boa! Placa reconhecida ✅ Clique em 'Ver dados' para consultar!",
    loading_vehicle: "Aguarde... Estou buscando os dados do veículo! 🔍",
    data_loaded: "Pronto! Confere as informações abaixo 👇",
    error: "Ops! Não encontrei na base, mas chama no WhatsApp que eu resolvo! 📱",
    ocr_analyzing: "Analisando a imagem da placa... 📷",
    ocr_success: "Placa identificada! Confere se está certa 👆",
};

// Typing animation hook
function useTypingEffect(text: string, speed: number = 35) {
    const [displayedText, setDisplayedText] = useState("");
    const [isTyping, setIsTyping] = useState(true);
    const indexRef = useRef(0);

    useEffect(() => {
        setDisplayedText("");
        indexRef.current = 0;
        setIsTyping(true);

        const interval = setInterval(() => {
            if (indexRef.current < text.length) {
                setDisplayedText(text.slice(0, indexRef.current + 1));
                indexRef.current++;
            } else {
                setIsTyping(false);
                clearInterval(interval);
            }
        }, speed);

        return () => clearInterval(interval);
    }, [text, speed]);

    return { displayedText, isTyping };
}

export const TiquinhoAssistant: React.FC<TiquinhoAssistantProps> = ({
    state,
    customMessage,
    isSticky = false,
    className,
}) => {
    const message = customMessage || MESSAGES[state];
    const { displayedText, isTyping } = useTypingEffect(message, 30);

    const isHappy = state === "plate_valid" || state === "data_loaded" || state === "ocr_success";
    const isLoading = state === "loading_vehicle" || state === "ocr_analyzing";

    return (
        <div
            className={cn(
                "w-full flex items-end gap-3 transition-all duration-300",
                isSticky && "sticky top-0 z-50 py-3 px-4 -mx-4 backdrop-blur-xl bg-slate-900/80 border-b border-white/5 shadow-lg",
                className
            )}
        >
            {/* Avatar/Mascot */}
            <div className="relative w-12 h-12 shrink-0">
                <div
                    className={cn(
                        "w-12 h-12 rounded-full border-2 shadow-lg overflow-hidden flex items-center justify-center transition-all duration-300",
                        isHappy
                            ? "border-green-400 bg-green-400/10 shadow-green-500/20"
                            : isLoading
                                ? "border-blue-400 bg-blue-400/10 shadow-blue-500/20 animate-pulse"
                                : "border-slate-400 bg-slate-400/10"
                    )}
                >
                    <img
                        alt="Tiquinho"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt_YDD7wGOwNo-2Gmi2t3Uqt2R45LQdVVCa6vmJmHCvtze_WoZBGI4OkoaQ-9dAp00tt4TSplaVcZF76H2S9abSzpBuiRRUK_MMcRqxvetoBwg1ifaiIz0DZ6eAR2e09yH_MllFjwJnyZGseGwKYz4iwmvTNISnjXNKPugb5jDZLtBxKeflJH8znY6OmBUoEjfcnMu3NX4PmgPiO-TfVg_cKca3HkfrM1cHDhle1cDUFLoQs4CVMgeZfwUAi1w1Vee8vKKSDuGVG4"
                    />
                </div>

                {/* Status indicator */}
                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 w-4 h-4 border-2 border-slate-900 rounded-full transition-colors duration-300",
                        isHappy
                            ? "bg-green-500"
                            : isLoading
                                ? "bg-blue-500 animate-pulse"
                                : state === "error"
                                    ? "bg-amber-500"
                                    : "bg-slate-500"
                    )}
                />
            </div>

            {/* Speech Bubble */}
            <div
                className={cn(
                    "relative flex-1 p-3 rounded-2xl rounded-bl-none shadow-lg border transition-all duration-300",
                    "bg-white/5 border-white/10 backdrop-blur-md"
                )}
            >
                {/* Typing indicator or message */}
                <p className="text-sm font-medium leading-relaxed text-slate-100 min-h-[1.5rem]">
                    {displayedText}
                    {isTyping && (
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-400 animate-pulse" />
                    )}
                </p>

                {/* Name badge */}
                <div className="absolute -top-2 left-3 px-2 py-0.5 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full text-[10px] font-bold text-white shadow-sm">
                    Tiquinho
                </div>
            </div>
        </div>
    );
};

export default TiquinhoAssistant;
