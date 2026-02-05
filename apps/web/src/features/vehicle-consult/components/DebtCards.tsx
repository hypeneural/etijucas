import React from "react";
import { IpvaScheduleDates, getDaysRemaining } from "@/domain/vehicle/scheduleSC";
import { cn } from "@/lib/utils";
import { PiggyBank, CalendarDays, CalendarClock, ReceiptText, FileCheck } from "lucide-react";

interface DebtCardsProps {
    dates: IpvaScheduleDates;
    currentDate?: Date; // Optional override for testing
}

export const DebtCards: React.FC<DebtCardsProps> = ({ dates }) => {
    // Helpers to format date nicely "10 Fev"
    const formatDate = (dateStr: string) => {
        if (!dateStr) return "--/--";
        const [year, month, day] = dateStr.split("-");
        const months = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
        return `${day} ${months[parseInt(month) - 1]}`;
    };

    const getUrgency = (dateStr: string) => {
        const days = getDaysRemaining(dateStr);
        if (days < 0) return { label: "Vencido", color: "text-red-500", bg: "bg-red-500/10" };
        if (days === 0) return { label: "Vence Hoje", color: "text-amber-500", bg: "bg-amber-500/10" };
        if (days <= 7) return { label: `Faltam ${days} dias`, color: "text-amber-400", bg: "bg-amber-400/10" };
        return { label: "Em dia", color: "text-slate-400", bg: "bg-slate-500/10" };
    };

    const CardItem = ({
        label,
        dateStr,
        icon,
        highlight = false,
        badgeText
    }: {
        label: string;
        dateStr: string;
        icon: React.ReactNode;
        highlight?: boolean;
        badgeText?: string;
    }) => {
        const urgency = getUrgency(dateStr);

        return (
            <div className={cn(
                "relative flex flex-col p-4 rounded-xl border transition-all hover:scale-[1.02]",
                highlight
                    ? "bg-gradient-to-br from-[#1e3a8a]/40 to-slate-900 border-blue-500/30 shadow-lg shadow-blue-900/20"
                    : "bg-[#1e293b]/50 border-slate-700/50",
                getDaysRemaining(dateStr) <= 3 && getDaysRemaining(dateStr) >= 0 ? "animate-pulse ring-1 ring-amber-500/50" : ""
            )}>
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <div className={cn("opacity-80", highlight ? "text-blue-400" : "text-slate-400")}>
                            {icon}
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</span>
                    </div>
                    {badgeText && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/20">
                            {badgeText}
                        </span>
                    )}
                </div>

                <div className="flex items-baseline gap-2 mt-auto">
                    <span className={cn("text-2xl font-bold tracking-tight", highlight ? "text-white" : "text-slate-200")}>
                        {formatDate(dateStr)}
                    </span>
                </div>

                <div className={cn("self-start mt-2 text-[10px] font-bold px-2 py-0.5 rounded-full", urgency.color, urgency.bg)}>
                    {urgency.label}
                </div>
            </div>
        );
    };

    return (
        <div className="grid grid-cols-2 gap-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">

            {/* Cota Única - Destaque */}
            <div className="col-span-2">
                <CardItem
                    label="Cota Única"
                    dateStr={dates.cotaUnica}
                    icon={<PiggyBank className="w-5 h-5" />}
                    highlight={true}
                    badgeText="Economize juros"
                />
            </div>

            <CardItem label="1ª Cota" dateStr={dates.parcela1} icon={<CalendarDays className="w-5 h-5" />} />
            <CardItem label="2ª Cota" dateStr={dates.parcela2} icon={<CalendarClock className="w-5 h-5" />} />
            <CardItem label="3ª Cota" dateStr={dates.parcela3} icon={<ReceiptText className="w-5 h-5" />} />

            {/* Licenciamento - Destaque menor */}
            <div className="relative flex flex-col p-4 rounded-xl border border-amber-500/20 bg-amber-900/10">
                <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center gap-2">
                        <FileCheck className="w-5 h-5 text-amber-400" />
                        <span className="text-xs font-semibold uppercase tracking-wider text-amber-400/80">Licenciamento</span>
                    </div>
                </div>
                <span className="text-2xl font-bold tracking-tight text-white mb-2">
                    {formatDate(dates.licenciamento)}
                </span>
                <div className="text-[10px] text-amber-300/60">
                    Obrigatório para rodar
                </div>
            </div>

        </div>
    );
};
