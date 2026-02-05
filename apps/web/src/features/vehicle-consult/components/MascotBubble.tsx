import React from "react";
import { cn } from "@/lib/utils";

export type MascotState = "idle" | "valid" | "loading" | "error" | "empty";

interface MascotBubbleProps {
    state: MascotState;
    className?: string;
}

export const MascotBubble: React.FC<MascotBubbleProps> = ({ state, className }) => {

    const getMessage = () => {
        switch (state) {
            case "empty":
                return "Digite a placa que eu te mostro as datas rapidinho.";
            case "loading":
                return "Tô puxando... 1 segundinho!";
            case "valid":
                return "Boa! Confere as informações abaixo 👇";
            case "error":
                return "Na base não veio, mas no Whats eu resolvo pra você.";
            case "idle":
            default:
                return "Consultar débitos e IPVA nunca foi tão fácil!";
        }
    };

    const isHappy = state === "valid" || state === "loading";
    const isNeutral = state === "empty" || state === "idle";

    return (
        <div className={cn("w-full flex items-end gap-3", className)}>

            {/* Avatar/Mascot Placeholder */}
            <div className="relative w-14 h-14 shrink-0 transition-transform duration-300 hover:scale-110">
                <div className={cn(
                    "w-14 h-14 rounded-full border-2 shadow-lg overflow-hidden flex items-center justify-center backdrop-blur-sm",
                    isHappy ? "border-green-400 bg-green-400/10" : "border-blue-400 bg-blue-400/10"
                )}>
                    {/* Replace with actual Mascot Image if available */}
                    <img
                        alt="Mascote Tiquinho"
                        className="w-full h-full object-cover"
                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDt_YDD7wGOwNo-2Gmi2t3Uqt2R45LQdVVCa6vmJmHCvtze_WoZBGI4OkoaQ-9dAp00tt4TSplaVcZF76H2S9abSzpBuiRRUK_MMcRqxvetoBwg1ifaiIz0DZ6eAR2e09yH_MllFjwJnyZGseGwKYz4iwmvTNISnjXNKPugb5jDZLtBxKeflJH8znY6OmBUoEjfcnMu3NX4PmgPiO-TfVg_cKca3HkfrM1cHDhle1cDUFLoQs4CVMgeZfwUAi1w1Vee8vKKSDuGVG4"
                    />
                </div>

                {/* Status indicator dot */}
                <div className={cn(
                    "absolute bottom-0 right-0 w-3.5 h-3.5 border-2 border-background rounded-full transition-colors duration-300",
                    state === "valid" ? "bg-green-500" :
                        state === "error" ? "bg-amber-500" :
                            state === "loading" ? "bg-blue-500 animate-pulse" : "bg-slate-400"
                )}></div>
            </div>

            {/* Speech Bubble */}
            <div className={cn(
                "relative p-3 rounded-2xl rounded-bl-none shadow-sm flex-1 transition-all duration-300 border backdrop-blur-md",
                "bg-white/5 border-white/10 text-slate-100"
            )}>
                <p className="text-sm font-medium leading-relaxed animate-in fade-in slide-in-from-left-2 duration-300 key-[state]">
                    {getMessage()}
                </p>
            </div>
        </div>
    );
};
