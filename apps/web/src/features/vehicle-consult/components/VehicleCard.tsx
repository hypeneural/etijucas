import React from "react";
import { cn } from "@/lib/utils";

interface VehicleData {
    brand: string;
    model: string;
    yearFab: string;
    yearMod: string;
    color: string;
    fuel: string;
    plate: string;
    city: string;
    state: string;
}

interface VehicleCardProps {
    data?: VehicleData | null;
    isLoading: boolean;
    className?: string;
}

export const VehicleCard: React.FC<VehicleCardProps> = ({ data, isLoading, className }) => {

    if (isLoading) {
        return (
            <div className={cn("bg-[#1e293b] rounded-xl overflow-hidden border border-slate-700/50 p-0", className)}>
                {/* Skeleton Header */}
                <div className="bg-slate-800/50 px-5 py-3 border-b border-slate-700/50 flex justify-between items-center">
                    <div className="h-4 w-32 bg-slate-700 rounded animate-pulse"></div>
                    <div className="h-5 w-24 bg-slate-700 rounded animate-pulse"></div>
                </div>
                {/* Skeleton Body */}
                <div className="p-5 grid grid-cols-2 gap-y-6 gap-x-4">
                    <div className="col-span-2 space-y-2">
                        <div className="h-3 w-20 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-6 w-3/4 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-16 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-5 w-20 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                    <div className="space-y-2">
                        <div className="h-3 w-16 bg-slate-700 rounded animate-pulse"></div>
                        <div className="h-5 w-20 bg-slate-700 rounded animate-pulse"></div>
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    return (
        <div className={cn("bg-[#1e293b] rounded-xl overflow-hidden border border-slate-700/50 shadow-lg animate-in fade-in zoom-in duration-300", className)}>
            {/* Header looking like a document header */}
            <div className="bg-slate-800/50 px-5 py-3 border-b border-slate-700/50 flex justify-between items-center">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <span className="material-symbols-outlined text-slate-400 text-lg">directions_car</span>
                    Dados do Veículo
                </h3>
                <div className="bg-green-500/10 text-green-400 border border-green-500/20 px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">check_circle</span>
                    Sem restrição
                </div>
            </div>

            {/* Document Body */}
            <div className="p-5 grid grid-cols-2 gap-y-5 gap-x-4">
                <div className="col-span-2">
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Marca / Modelo</p>
                    <p className="text-lg font-medium text-white tracking-tight">{data.brand} / {data.model}</p>
                </div>

                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Ano Fab/Mod</p>
                    <p className="text-base font-medium text-slate-200">{data.yearFab} / {data.yearMod}</p>
                </div>

                <div>
                    <p className="text-[10px] text-slate-400 uppercase tracking-wider mb-1 font-semibold">Cor</p>
                    <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-full bg-slate-400 border border-slate-600"></span>
                        <p className="text-base font-medium text-slate-200">{data.color}</p>
                    </div>
                </div>

                <div className="col-span-2 pt-3 border-t border-dashed border-slate-700/50 flex justify-between items-center">
                    <p className="text-[10px] text-slate-500 italic">Município: {data.city} - {data.state}</p>
                </div>
            </div>
        </div>
    );
};
