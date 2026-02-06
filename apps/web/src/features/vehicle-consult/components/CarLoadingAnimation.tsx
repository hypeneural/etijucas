import React from "react";
import { cn } from "@/lib/utils";

interface CarLoadingAnimationProps {
    message?: string;
    className?: string;
}

export const CarLoadingAnimation: React.FC<CarLoadingAnimationProps> = ({
    message = "Buscando Dados do Veículo!",
    className,
}) => {
    return (
        <div
            className={cn(
                "w-full py-8 flex flex-col items-center justify-center gap-4",
                className
            )}
        >
            {/* Road with car */}
            <div className="relative w-full max-w-xs h-20 overflow-hidden">
                {/* Road */}
                <div className="absolute bottom-2 left-0 right-0 h-2 bg-slate-700 rounded-full overflow-hidden">
                    {/* Road markings - animated */}
                    <div className="absolute inset-0 flex items-center animate-road-marks">
                        {[...Array(10)].map((_, i) => (
                            <div
                                key={i}
                                className="w-4 h-0.5 bg-yellow-400 mx-3 rounded-full"
                            />
                        ))}
                    </div>
                </div>

                {/* Car SVG - bouncing and moving */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 animate-car-bounce">
                    <svg
                        width="80"
                        height="40"
                        viewBox="0 0 80 40"
                        className="drop-shadow-lg"
                    >
                        {/* Car body */}
                        <path
                            d="M10 25 L15 15 L30 10 L55 10 L65 15 L70 25 L70 30 L10 30 Z"
                            fill="url(#carGradient)"
                            className="drop-shadow-md"
                        />
                        {/* Windows */}
                        <path
                            d="M18 16 L28 12 L35 12 L35 20 L18 20 Z"
                            fill="#1e3a5f"
                            opacity="0.8"
                        />
                        <path
                            d="M38 12 L52 12 L58 16 L58 20 L38 20 Z"
                            fill="#1e3a5f"
                            opacity="0.8"
                        />
                        {/* Headlights */}
                        <circle cx="68" cy="22" r="2" fill="#fef08a" className="animate-pulse" />
                        {/* Rear light */}
                        <circle cx="12" cy="22" r="2" fill="#ef4444" />

                        {/* Front wheel */}
                        <g className="origin-center animate-wheel-spin" style={{ transformOrigin: "58px 32px" }}>
                            <circle cx="58" cy="32" r="6" fill="#334155" />
                            <circle cx="58" cy="32" r="3" fill="#64748b" />
                            <line x1="58" y1="26" x2="58" y2="38" stroke="#94a3b8" strokeWidth="1" />
                            <line x1="52" y1="32" x2="64" y2="32" stroke="#94a3b8" strokeWidth="1" />
                        </g>

                        {/* Rear wheel */}
                        <g className="origin-center animate-wheel-spin" style={{ transformOrigin: "22px 32px" }}>
                            <circle cx="22" cy="32" r="6" fill="#334155" />
                            <circle cx="22" cy="32" r="3" fill="#64748b" />
                            <line x1="22" y1="26" x2="22" y2="38" stroke="#94a3b8" strokeWidth="1" />
                            <line x1="16" y1="32" x2="28" y2="32" stroke="#94a3b8" strokeWidth="1" />
                        </g>

                        {/* Gradient definition */}
                        <defs>
                            <linearGradient id="carGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                <stop offset="0%" stopColor="#3b82f6" />
                                <stop offset="100%" stopColor="#1d4ed8" />
                            </linearGradient>
                        </defs>
                    </svg>
                </div>

                {/* Dust particles */}
                <div className="absolute bottom-4 left-[calc(50%-50px)] flex gap-1">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-2 h-2 rounded-full bg-slate-500/50 animate-dust"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* Message */}
            <div className="flex items-center gap-2">
                <span className="text-slate-200 font-semibold text-sm animate-pulse">
                    {message}
                </span>
                <div className="flex gap-0.5">
                    {[...Array(3)].map((_, i) => (
                        <div
                            key={i}
                            className="w-1.5 h-1.5 rounded-full bg-blue-400 animate-bounce"
                            style={{ animationDelay: `${i * 0.15}s` }}
                        />
                    ))}
                </div>
            </div>

            {/* CSS Animations via style tag */}
            <style>{`
                @keyframes road-marks {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-56px); }
                }
                @keyframes car-bounce {
                    0%, 100% { transform: translateX(-50%) translateY(0); }
                    50% { transform: translateX(-50%) translateY(-3px); }
                }
                @keyframes wheel-spin {
                    0% { transform: rotate(0deg); }
                    100% { transform: rotate(360deg); }
                }
                @keyframes dust {
                    0% { opacity: 0.6; transform: translateX(0) scale(1); }
                    100% { opacity: 0; transform: translateX(-20px) scale(0.5); }
                }
                .animate-road-marks {
                    animation: road-marks 0.5s linear infinite;
                }
                .animate-car-bounce {
                    animation: car-bounce 0.3s ease-in-out infinite;
                }
                .animate-wheel-spin {
                    animation: wheel-spin 0.3s linear infinite;
                }
                .animate-dust {
                    animation: dust 0.6s ease-out infinite;
                }
            `}</style>
        </div>
    );
};

export default CarLoadingAnimation;
