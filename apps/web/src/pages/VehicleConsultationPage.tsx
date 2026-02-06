import React, { useState, useEffect } from "react";
import { PlateInput } from "../features/vehicle-consult/components/PlateInput";
import { MascotBubble, MascotState } from "../features/vehicle-consult/components/MascotBubble";
import { DebtCards } from "../features/vehicle-consult/components/DebtCards";
import { VehicleCard } from "../features/vehicle-consult/components/VehicleCard";
import { isValidPlate, getPlateFinal, formatPlateVisual } from "../domain/vehicle/plate";
import { getIpvaDates, IpvaScheduleDates } from "../domain/vehicle/scheduleSC";
import { getConsultationLink, getNotFoundLink, getShareLink } from "../domain/vehicle/whatsapp";
import { ViralCardModal } from "../features/vehicle-consult/components/ViralCardModal";
import { SwipeableItem } from "../components/ui/SwipeableList";
import { vehicleService, VehicleLookupResponse, VehicleBasicData } from "../services/vehicle.service";
import { toast } from "sonner";
import { cn } from "../lib/utils";
import { Icon } from "@iconify/react";
import {
    Warehouse,
    Star,
    Trash2,
    ScanSearch,
    ChevronRight,
    ArrowLeft,
    ArrowRight,
    Share2,
    CalendarDays,
    Check,
    ArrowUpRight,
    Dices,
    RefreshCw,
    Info,
    Car
} from "lucide-react";

interface SavedVehicle {
    plate: string;
    addedAt: number;
    finalDigit: number;
}

// Vehicle data for display (mapped from API response)
interface VehicleDisplayData {
    brand: string;
    model: string;
    yearFab: string;
    yearMod: string;
    color: string;
    fuel: string;
    plate: string;
    city: string;
    state: string;
    logoUrl?: string;
    situacao?: string;
    fipeValue?: string;
}

const VehicleConsultationPage: React.FC = () => {
    const [plate, setPlate] = useState("");
    const [status, setStatus] = useState<MascotState>("empty");
    const [schedule, setSchedule] = useState<IpvaScheduleDates | undefined>(undefined);
    const [vehicleData, setVehicleData] = useState<any>(null);
    const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
    const [showGarage, setShowGarage] = useState(false);

    // Animation Steps: 0=Idle, 1=Dates, 2=VehicleSkeleton, 3=Complete/CTA
    const [step, setStep] = useState(0);
    const [showViralModal, setShowViralModal] = useState(false);

    // Load Saved Vehicles
    useEffect(() => {
        const saved = localStorage.getItem("titico_vehicles");
        if (saved) {
            try {
                setSavedVehicles(JSON.parse(saved));
            } catch (e) {
                console.error("Failed to parse saved vehicles");
            }
        }
    }, []);

    const saveVehicle = (plateToSave: string) => {
        if (!isValidPlate(plateToSave)) return;

        const newVehicle: SavedVehicle = {
            plate: plateToSave,
            addedAt: Date.now(),
            finalDigit: getPlateFinal(plateToSave)
        };

        const exists = savedVehicles.some(v => v.plate === plateToSave);
        if (exists) {
            toast.info("Veículo já está na garagem!");
            return;
        }

        const updated = [newVehicle, ...savedVehicles].slice(0, 5); // Limit 5
        setSavedVehicles(updated);
        localStorage.setItem("titico_vehicles", JSON.stringify(updated));
        toast.success("Veículo salvo na garagem!");
    };

    const removeVehicle = (plateToRemove: string) => {
        const updated = savedVehicles.filter(v => v.plate !== plateToRemove);
        setSavedVehicles(updated);
        localStorage.setItem("titico_vehicles", JSON.stringify(updated));
        toast.info("Veículo removido.");
    };

    // Instant Partial Result Logic (Pre-calculation)
    useEffect(() => {
        if (isValidPlate(plate)) {
            const finalDigit = getPlateFinal(plate);
            const dates = getIpvaDates(finalDigit);
            setSchedule(dates);
            setStatus("valid");

            // If we are already viewing results and plate changes, we might want to reset or live update?
            // tailored for "Scan Mode": Only auto-search if it matches a pattern or user clicks?
            // For now, let's keep auto-trigger if not already showing results
            if (step === 0) {
                handleSearch(plate);
            }
        } else {
            if (plate.length === 0) setStatus("empty");
            if (plate.length < 7) {
                setSchedule(undefined);
                setStep(0);
                setVehicleData(null);
            }
        }
    }, [plate]);

    const handleSearch = async (currentPlate: string) => {
        // Reset sequence
        setStep(0);
        setStatus("loading");
        setVehicleData(null);
        setShowGarage(false);

        // STAGE 1: Confirm Plate & Show Dates (Immediate/Fast)
        setTimeout(() => {
            setStep(1);
        }, 300);

        // STAGE 2: Start Vehicle Fetch & Show Skeleton
        setTimeout(() => {
            setStep(2);
        }, 800);

        try {
            // Call real backend API
            const response = await vehicleService.lookup({ plate: currentPlate });

            if (response.ok && response.data.basic) {
                // Map API response to display format
                const basic = response.data.basic;
                const extra = response.data.extra;
                const fipe = response.data.fipe;

                // Get best FIPE value (highest score)
                let fipeValue: string | undefined;
                if (fipe?.dados?.length) {
                    const bestFipe = fipe.dados.reduce((best, curr) =>
                        curr.score > (best?.score ?? 0) ? curr : best
                        , fipe.dados[0]);
                    fipeValue = bestFipe?.texto_valor;
                }

                const displayData: VehicleDisplayData = {
                    brand: basic.brand ?? "N/A",
                    model: basic.model ?? "N/A",
                    yearFab: basic.ano ?? extra?.ano_fabricacao ?? "N/A",
                    yearMod: basic.anoModelo ?? extra?.ano_modelo ?? "N/A",
                    color: basic.color ?? "N/A",
                    fuel: extra?.combustivel ?? "N/A",
                    plate: response.plate,
                    city: basic.municipio ?? "N/A",
                    state: basic.uf ?? "SC",
                    logoUrl: basic.logoUrl ?? undefined,
                    situacao: basic.situacao ?? undefined,
                    fipeValue,
                };

                setVehicleData(displayData);
                setStatus("valid");

                // Show cache info if it was a cache hit
                if (response.cache.hit) {
                    toast.info("Dados do cache (atualizado recentemente)", {
                        duration: 2000,
                        icon: "💾"
                    });
                }
            } else {
                // API returned error or no data
                setStatus("error");
                toast.error(response.message ?? "Veículo não encontrado");
            }

            // STAGE 3: Show CTA (Complete)
            setStep(3);
        } catch (err) {
            console.error("Vehicle lookup error:", err);
            setStatus("error");
            setStep(3); // Show CTA anyway to allow "Talk to Titico"
            toast.error("Erro ao consultar veículo. Tente novamente.");
        }
    };

    const handleWhatsappClick = () => {
        if (status === "error" || !vehicleData) {
            window.open(getNotFoundLink(plate), "_blank");
        } else {
            window.open(getConsultationLink(plate), "_blank");
        }
    };

    const handleShare = () => {
        const link = getShareLink(plate, "Confira os vencimentos!");
        window.open(link, "_blank");
    };

    const setExample = (val: string) => setPlate(val);

    // Scroll detection for Smart CTA
    const [isCtaMinimized, setIsCtaMinimized] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;

            // Minimize on scroll down (if > 50px), Expand on scroll up
            if (currentScrollY > lastScrollY && currentScrollY > 50) {
                setIsCtaMinimized(true);
            } else {
                setIsCtaMinimized(false);
            }

            setLastScrollY(currentScrollY);
        };

        window.addEventListener("scroll", handleScroll, { passive: true });
        return () => window.removeEventListener("scroll", handleScroll);
    }, [lastScrollY]);

    return (
        <div className="min-h-screen bg-[#101623] pb-40 font-sans relative overflow-x-hidden selection:bg-blue-500/30">

            <div className="fixed inset-0 pointer-events-none opacity-20" style={{
                backgroundImage: "radial-gradient(#256af4 1px, transparent 1px)",
                backgroundSize: "24px 24px"
            }}></div>

            <header className="relative z-10 p-6 flex items-center justify-between">
                <div onClick={() => window.history.back()} className="cursor-pointer">
                    <h2 className="text-white text-2xl font-bold leading-none tracking-tight">IPVA SC</h2>
                    <span className="text-blue-400 text-xs font-bold uppercase tracking-widest opacity-80">Titico App</span>
                </div>
                <div
                    onClick={() => setShowGarage(!showGarage)}
                    className="w-10 h-10 rounded-full bg-[#1e293b] border border-white/10 flex items-center justify-center shadow-lg cursor-pointer hover:bg-slate-700 transition-colors relative"
                >
                    <Warehouse className="w-5 h-5 text-blue-500" />
                    {savedVehicles.length > 0 && (
                        <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white border-2 border-[#101623]">
                            {savedVehicles.length}
                        </span>
                    )}
                </div>
            </header>

            {/* Garage Drawer/List */}
            {showGarage && (
                <div className="px-6 mb-6 animate-in slide-in-from-top-4 duration-300 relative z-30">
                    <div className="bg-[#1e293b]/90 backdrop-blur-md rounded-2xl border border-white/10 p-4 shadow-2xl">
                        <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                            <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                            Minha Garagem
                        </h3>
                        {savedVehicles.length === 0 ? (
                            <p className="text-slate-400 text-sm py-2">Nenhum veículo salvo ainda. Consulte uma placa e clique em salvar!</p>
                        ) : (
                            <div className="space-y-3">
                                {savedVehicles.map((v) => (
                                    <SwipeableItem
                                        key={v.plate}
                                        onSwipeRight={() => removeVehicle(v.plate)}
                                        onSwipeLeft={() => {
                                            setPlate(v.plate);
                                            setShowGarage(false);
                                        }}
                                        rightIcon={<Trash2 className="w-6 h-6 text-white" />}
                                        rightActionColor="bg-red-500/80"
                                        leftIcon={<ScanSearch className="w-6 h-6 text-white" />}
                                        leftActionColor="bg-blue-500/80"
                                    >
                                        <div
                                            className="flex items-center justify-between p-3 cursor-pointer hover:bg-white/5 transition-colors"
                                            onClick={() => {
                                                setPlate(v.plate);
                                                setShowGarage(false);
                                            }}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold">
                                                    {v.finalDigit}
                                                </div>
                                                <div>
                                                    <p className="text-white font-bold font-mono tracking-wider">{formatPlateVisual(v.plate)}</p>
                                                    <p className="text-[10px] text-slate-400">Tocar para consultar</p>
                                                </div>
                                            </div>
                                            <ChevronRight className="w-5 h-5 text-slate-500" />
                                        </div>
                                    </SwipeableItem>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-2 opacity-50">
                            <span className="flex items-center gap-1"><ArrowLeft className="w-3 h-3" /> Swipe</span>
                            <span>para ações</span>
                            <span className="flex items-center gap-1">Swipe <ArrowRight className="w-3 h-3" /></span>
                        </div>
                    </div>
                </div>
            )}

            <main className="relative z-10 px-6 flex flex-col w-full max-w-md mx-auto">

                <div className="text-center mb-8 mt-4 animate-in slide-in-from-top-4 fade-in duration-500">
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">Consulta Veicular</h1>
                    <p className="text-slate-400 text-sm font-medium">Digite sua placa e veja IPVA + licenciamento em 2 segundos.</p>
                </div>

                <div className="mb-6 relative z-20">
                    <PlateInput
                        value={plate}
                        onChange={setPlate}
                        isValid={status === "valid"}
                        isLoading={status === "loading"}
                        hasError={status === "error"}
                        errorMessage={status === "error" ? "Veículo não encontrado. Tente novamente ou fale com o Titico." : undefined}
                    />
                </div>

                {step === 0 && (
                    <div className="flex gap-2 justify-center mb-8 animate-in fade-in duration-700 delay-150">
                        <button
                            onClick={() => setExample("MKE9876")} // Example plate
                            className="bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                        >
                            <Dices className="w-4 h-4 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                            Preencher exemplo
                        </button>
                    </div>
                )}

                <div className="mb-6">
                    <MascotBubble state={status} />
                </div>

                {/* RESULTS SHEET - STAGED REVEAL */}
                {schedule && step >= 1 && (
                    <div className="flex flex-col gap-6">

                        {/* STAGE 1: DATES & HEADER */}
                        <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-blue-500" />
                                    Vencimentos <span className="text-slate-500 text-sm font-normal">(Final {getPlateFinal(plate)})</span>
                                </h3>

                                {/* Only show actions when fully loaded */}
                                {step >= 3 && (
                                    <div className="flex gap-2 animate-in fade-in zoom-in duration-300">
                                        <button
                                            onClick={() => saveVehicle(plate)}
                                            className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-yellow-500/10 transition-colors"
                                        >
                                            <Star className="w-4 h-4" />
                                            Salvar
                                        </button>
                                        <button
                                            onClick={() => setShowViralModal(true)}
                                            className="text-xs text-pink-400 hover:text-pink-300 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-pink-500/10 transition-colors"
                                        >
                                            <Share2 className="w-4 h-4" />
                                            Card Viral
                                        </button>
                                    </div>
                                )}
                            </div>
                            <DebtCards dates={schedule} />
                        </div>

                        {/* STAGE 2: VEHICLE DATA */}
                        {step >= 2 && (
                            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards delay-100">
                                <VehicleCard isLoading={step < 3} data={vehicleData} />
                            </div>
                        )}

                        {step >= 3 && (
                            <div className="text-[10px] text-slate-500 text-center pb-24 px-4 leading-relaxed opacity-60 animate-in fade-in duration-500">
                                Datas conforme tabela oficial SC. Consulte débitos completos para valores exatos.
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* STAGE 3: CTA - FIXED ABOVE TAB BAR */}
            {step >= 3 && (
                <div
                    className={cn(
                        "fixed left-0 w-full z-40 p-4 transition-all duration-500 ease-in-out",
                        isCtaMinimized
                            ? "py-2 bg-[#101623]/95 backdrop-blur-md border-t border-white/5"
                            : "bg-gradient-to-t from-[#101623] via-[#101623]/95 to-transparent backdrop-blur-[2px]"
                    )}
                    style={{ bottom: 'calc(var(--tab-bar-height, 5rem) + 0.5rem)' }}
                >
                    <div className="max-w-md mx-auto flex flex-col gap-2">
                        <button
                            onClick={handleWhatsappClick}
                            className={cn(
                                "w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all duration-500 transform active:scale-95 group relative overflow-hidden",
                                isCtaMinimized ? "h-12 text-sm" : "h-14"
                            )}
                        >
                            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300"></div>

                            {/* Icon acts as main trigger on minimized */}
                            <Icon icon="mdi:whatsapp" width={isCtaMinimized ? "20" : "24"} height={isCtaMinimized ? "20" : "24"} className="text-white relative z-10 transition-all" />

                            <span className="relative z-10 whitespace-nowrap">
                                {status === "error" ? "Não achou? Falar com Titico" : "Consultar débitos"}
                            </span>

                            {!isCtaMinimized && (
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                            )}
                        </button>

                        {status !== "error" && (
                            <div className={cn(
                                "flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium opacity-80 transition-all duration-300 overflow-hidden",
                                isCtaMinimized ? "h-0 opacity-0" : "h-auto opacity-100"
                            )}>
                                <span className="flex items-center gap-1"><Check className="w-3 h-3 text-green-500" /> Resposta rápida</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>Evita multa</span>
                                <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                                <span>Sem enrolação</span>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Viral Card Modal */}
            {schedule && (
                <ViralCardModal
                    isOpen={showViralModal}
                    onClose={() => setShowViralModal(false)}
                    plate={plate}
                    schedule={schedule}
                />
            )}

        </div>
    );
};

export default VehicleConsultationPage;
