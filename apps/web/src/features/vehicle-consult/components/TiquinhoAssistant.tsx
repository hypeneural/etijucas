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
    className?: string;
}

const MESSAGES: Record<TiquinhoState, string> = {
    greeting: "Olá! Sou o Tiquinho, o Atendente do Despachante Titico de Tijucas/SC! 👋",
    idle: "Digite a placa que eu te mostro as datas rapidinho! 🚗",
    plate_valid: "Boa! Placa reconhecida ✅ Clique em 'Ver dados do Veículo' para consultar!",
    loading_vehicle: "Aguarde... Estou buscando os dados do veículo! 🔍",
    data_loaded: "Pronto! Confere as informações abaixo 👇",
    error: "Ops! Não encontrei na base, mas chama no WhatsApp que eu resolvo! 📱",
    ocr_analyzing: "Analisando a imagem da placa... 📷",
    ocr_success: "Placa identificada! Confere se está certa 👆",
};

// Get base URL from environment or default to production
const getBaseUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'https://etijucas.com.br';
};

// Avatar image with absolute URL
const TIQUINHO_AVATAR = `${getBaseUrl()}/app/images/tiquinho.jpg`;

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
    className,
}) => {
    const message = customMessage || MESSAGES[state];
    const { displayedText, isTyping } = useTypingEffect(message, 30);
    const containerRef = useRef<HTMLDivElement>(null);
    const [isOutOfView, setIsOutOfView] = useState(false);

    // Intersection Observer to detect when Tiquinho goes out of view
    useEffect(() => {
        const observer = new IntersectionObserver(
            ([entry]) => {
                // When less than 10% is visible, make it sticky
                setIsOutOfView(!entry.isIntersecting);
            },
            { threshold: 0.1 }
        );

        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, []);

    const isHappy = state === "plate_valid" || state === "data_loaded" || state === "ocr_success";
    const isLoading = state === "loading_vehicle" || state === "ocr_analyzing";

    // Bubble content component (reused in normal and sticky modes)
    const BubbleContent = ({ isCompact = false }: { isCompact?: boolean }) => (
        <div className={cn("flex items-end gap-3", isCompact && "items-center")}>
            {/* Avatar/Mascot */}
            <div className={cn("relative shrink-0", isCompact ? "w-10 h-10" : "w-12 h-12")}>
                <div
                    className={cn(
                        "rounded-full border-2 shadow-lg overflow-hidden flex items-center justify-center transition-all duration-300",
                        isCompact ? "w-10 h-10" : "w-12 h-12",
                        isHappy
                            ? "border-green-400 shadow-green-500/20"
                            : isLoading
                                ? "border-blue-400 shadow-blue-500/20 animate-pulse"
                                : "border-slate-400",
                        isLoading && "animate-bounce"
                    )}
                >
                    <img
                        alt="Tiquinho"
                        className="w-full h-full object-cover"
                        src={TIQUINHO_AVATAR}
                    />
                </div>

                {/* Status indicator */}
                <div
                    className={cn(
                        "absolute -bottom-0.5 -right-0.5 border-2 border-slate-900 rounded-full transition-colors duration-300",
                        isCompact ? "w-3 h-3" : "w-4 h-4",
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
                    "relative flex-1 rounded-2xl rounded-bl-none shadow-lg border transition-all duration-300",
                    "bg-white/5 border-white/10 backdrop-blur-md",
                    isCompact ? "p-2.5" : "p-3"
                )}
            >
                <p className={cn(
                    "font-medium leading-relaxed text-slate-100",
                    isCompact ? "text-sm min-h-[1.5rem]" : "text-sm min-h-[1.5rem]"
                )}>
                    {displayedText}
                    {isTyping && (
                        <span className="inline-block w-0.5 h-4 ml-0.5 bg-blue-400 animate-pulse" />
                    )}
                </p>

                {/* Name badge */}
                <div className={cn(
                    "absolute left-3 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full font-bold text-white shadow-sm",
                    isCompact ? "-top-1.5 px-1.5 py-0.5 text-[8px]" : "-top-2 px-2 py-0.5 text-[10px]"
                )}>
                    Tiquinho
                </div>
            </div>
        </div>
    );

    return (
        <>
            {/* Original position placeholder */}
            <div ref={containerRef} className={cn("w-full", className)}>
                <BubbleContent />
            </div>

            {/* Sticky floating version when out of view */}
            {isOutOfView && (
                <div className="fixed top-0 left-0 right-0 z-50 animate-in slide-in-from-top-4 fade-in duration-300">
                    <div className="max-w-md mx-auto px-4 py-2 backdrop-blur-xl bg-slate-900/90 border-b border-white/10 shadow-2xl">
                        <BubbleContent isCompact />
                    </div>
                </div>
            )}
        </>
    );
};

export default TiquinhoAssistant;

