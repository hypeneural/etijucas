import React, { useRef, useState } from "react";
import { toPng } from "html-to-image";
import { X, Download, Share2, Instagram, MessageCircle } from "lucide-react";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import { formatPlateVisual, getPlateFinal } from "@/domain/vehicle/plate";
import { IpvaScheduleDates } from "@/domain/vehicle/scheduleSC";

interface ViralCardModalProps {
    isOpen: boolean;
    onClose: () => void;
    plate: string;
    schedule: IpvaScheduleDates;
}

export const ViralCardModal: React.FC<ViralCardModalProps> = ({
    isOpen,
    onClose,
    plate,
    schedule,
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [isGenerating, setIsGenerating] = useState(false);
    const [activeFormat, setActiveFormat] = useState<"story" | "post">("story");

    if (!isOpen) return null;

    const formatDate = (dateStr: string) => {
        if (!dateStr) return "--/--";
        const [year, month, day] = dateStr.split("-");
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${day} ${months[parseInt(month) - 1]}`;
    };

    const handleDownload = async () => {
        if (!cardRef.current) return;
        setIsGenerating(true);

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2, // Higher resolution
            });

            const link = document.createElement("a");
            link.download = `ipva-${plate.toLowerCase()}-${activeFormat}.png`;
            link.href = dataUrl;
            link.click();
        } catch (error) {
            console.error("Error generating image:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleShare = async (target: "whatsapp" | "instagram" | "generic") => {
        if (!cardRef.current) return;
        setIsGenerating(true);

        try {
            const dataUrl = await toPng(cardRef.current, {
                cacheBust: true,
                pixelRatio: 2,
            });

            // Convert to blob for sharing
            const response = await fetch(dataUrl);
            const blob = await response.blob();
            const file = new File([blob], `ipva-${plate}.png`, { type: "image/png" });

            if (target === "whatsapp") {
                // WhatsApp doesn't support direct image sharing via URL, so we use Web Share API
                if (navigator.share) {
                    await navigator.share({
                        files: [file],
                        title: `Vencimentos IPVA - ${formatPlateVisual(plate)}`,
                        text: "Confira os vencimentos do meu veículo! 🚗",
                    });
                } else {
                    // Fallback: download and let user share manually
                    handleDownload();
                }
            } else if (target === "generic" && navigator.share) {
                await navigator.share({
                    files: [file],
                    title: `IPVA SC - ${formatPlateVisual(plate)}`,
                });
            } else {
                handleDownload();
            }
        } catch (error) {
            console.error("Error sharing:", error);
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm animate-in fade-in duration-300">
            {/* Overlay Click to Close */}
            <div className="absolute inset-0" onClick={onClose} />

            {/* Modal Content */}
            <div className="relative z-10 w-full max-w-sm mx-4 bg-[#1e293b] rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-white font-bold flex items-center gap-2">
                        <Share2 className="w-5 h-5 text-blue-400" />
                        Gerar Card Viral
                    </h3>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
                    >
                        <X className="w-5 h-5 text-slate-400" />
                    </button>
                </div>

                {/* Format Toggle */}
                <div className="flex gap-2 p-4 pb-2">
                    <button
                        onClick={() => setActiveFormat("story")}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                            activeFormat === "story"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        Story (9:16)
                    </button>
                    <button
                        onClick={() => setActiveFormat("post")}
                        className={cn(
                            "flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all",
                            activeFormat === "post"
                                ? "bg-blue-500 text-white"
                                : "bg-slate-700/50 text-slate-400 hover:bg-slate-700"
                        )}
                    >
                        Post (1:1)
                    </button>
                </div>

                {/* Card Preview */}
                <div className="p-4 flex justify-center overflow-hidden">
                    <div
                        ref={cardRef}
                        className={cn(
                            "bg-gradient-to-br from-[#0f172a] via-[#1e3a8a] to-[#0f172a] rounded-xl overflow-hidden flex flex-col items-center justify-center p-6 shadow-lg relative",
                            activeFormat === "story" ? "w-[270px] h-[480px]" : "w-[300px] h-[300px]"
                        )}
                        style={{
                            backgroundImage: "radial-gradient(rgba(59, 130, 246, 0.15) 1px, transparent 1px)",
                            backgroundSize: "16px 16px",
                        }}
                    >
                        {/* Logo/Brand */}
                        <div className="absolute top-4 left-4 flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                <span className="text-white font-bold text-sm">T</span>
                            </div>
                            <span className="text-white/80 text-xs font-bold tracking-wider">TITICO APP</span>
                        </div>

                        {/* Main Content */}
                        <div className="flex flex-col items-center text-center mt-8">
                            {/* Plate Badge */}
                            <div className="bg-white rounded-lg px-6 py-3 shadow-lg mb-4">
                                <span className="text-2xl font-bold text-slate-900 font-mono tracking-wider">
                                    {formatPlateVisual(plate)}
                                </span>
                            </div>

                            <p className="text-blue-300 text-sm mb-4">Final {getPlateFinal(plate)}</p>

                            {/* Key Dates */}
                            <div className={cn(
                                "w-full space-y-2",
                                activeFormat === "story" ? "mt-4" : ""
                            )}>
                                <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-slate-300 text-sm">Cota Única</span>
                                    <span className="text-white font-bold">{formatDate(schedule.cotaUnica)}</span>
                                </div>
                                <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
                                    <span className="text-slate-300 text-sm">1ª Cota</span>
                                    <span className="text-white font-bold">{formatDate(schedule.parcela1)}</span>
                                </div>
                                {activeFormat === "story" && (
                                    <>
                                        <div className="bg-white/10 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
                                            <span className="text-slate-300 text-sm">2ª Cota</span>
                                            <span className="text-white font-bold">{formatDate(schedule.parcela2)}</span>
                                        </div>
                                        <div className="bg-amber-500/20 border border-amber-500/30 rounded-lg p-3 flex justify-between items-center backdrop-blur-sm">
                                            <span className="text-amber-300 text-sm">Licenciamento</span>
                                            <span className="text-amber-100 font-bold">{formatDate(schedule.licenciamento)}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        </div>

                        {/* Footer CTA */}
                        <div className="absolute bottom-4 left-4 right-4 flex flex-col items-center">
                            <div className="bg-[#25D366] text-white text-xs font-bold px-4 py-2 rounded-full flex items-center gap-2">
                                <Icon icon="mdi:whatsapp" width="16" height="16" />
                                Consulta grátis pelo Titico
                            </div>
                            <span className="text-white/40 text-[10px] mt-2">etijucas.com.br</span>
                        </div>
                    </div>
                </div>

                {/* Actions */}
                <div className="p-4 pt-0 grid grid-cols-3 gap-2">
                    <button
                        onClick={handleDownload}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-700/50 hover:bg-slate-700 transition-colors disabled:opacity-50"
                    >
                        <Download className="w-5 h-5 text-blue-400" />
                        <span className="text-xs text-slate-300">Baixar</span>
                    </button>
                    <button
                        onClick={() => handleShare("whatsapp")}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-[#25D366]/20 hover:bg-[#25D366]/30 transition-colors disabled:opacity-50"
                    >
                        <Icon icon="mdi:whatsapp" width="20" height="20" className="text-[#25D366]" />
                        <span className="text-xs text-slate-300">WhatsApp</span>
                    </button>
                    <button
                        onClick={() => handleShare("generic")}
                        disabled={isGenerating}
                        className="flex flex-col items-center gap-1 p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20 hover:from-purple-500/30 hover:to-pink-500/30 transition-colors disabled:opacity-50"
                    >
                        <Instagram className="w-5 h-5 text-pink-400" />
                        <span className="text-xs text-slate-300">Stories</span>
                    </button>
                </div>

                {isGenerating && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                )}
            </div>
        </div>
    );
};
