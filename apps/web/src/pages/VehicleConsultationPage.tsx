import React, { useState, useEffect, useMemo } from "react";
import { PlateInput } from "../features/vehicle-consult/components/PlateInput";
import { TiquinhoAssistant, TiquinhoState } from "../features/vehicle-consult/components/TiquinhoAssistant";
import { CarLoadingAnimation } from "../features/vehicle-consult/components/CarLoadingAnimation";
import { DebtCards } from "../features/vehicle-consult/components/DebtCards";
import { isValidPlate, getPlateFinal, formatPlateVisual } from "../domain/vehicle/plate";
import { getIpvaDates, IpvaScheduleDates } from "../domain/vehicle/scheduleSC";
import { getShareLink } from "../domain/vehicle/whatsapp";
import { ViralCardModal } from "../features/vehicle-consult/components/ViralCardModal";
import { PlateOcrSheet } from "../features/vehicle-consult/components/PlateOcrSheet";
import { SwipeableItem } from "../components/ui/SwipeableList";
import { vehicleService, VehicleLookupResponse } from "../services/vehicle.service";
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
    Dices,
    Car,
    Search,
    Fuel,
    Palette,
    MapPin,
    Users,
    Gauge,
    Globe,
    ShieldCheck,
    Tag,
    DollarSign,
    Calendar,
    Hash,
    Loader2,
    ChevronDown,
    ChevronUp
} from "lucide-react";

interface SavedVehicle {
    plate: string;
    addedAt: number;
    finalDigit: number;
}

// WhatsApp link for consultations
const WHATSAPP_LINK = "https://api.whatsapp.com/send?phone=5548991414232";

const VehicleConsultationPage: React.FC = () => {
    const [plate, setPlate] = useState("");
    const [schedule, setSchedule] = useState<IpvaScheduleDates | undefined>(undefined);
    const [vehicleData, setVehicleData] = useState<VehicleLookupResponse | null>(null);
    const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
    const [showGarage, setShowGarage] = useState(false);
    const [isLoadingVehicle, setIsLoadingVehicle] = useState(false);
    const [showExtraInfo, setShowExtraInfo] = useState(false);
    const [showFipeInfo, setShowFipeInfo] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Step: 0=Empty, 1=Plate valid (show dates + button), 2=Loading vehicle, 3=Vehicle data shown
    const [step, setStep] = useState(0);
    const [showViralModal, setShowViralModal] = useState(false);
    const [showOcrSheet, setShowOcrSheet] = useState(false);
    const [isOcrAnalyzing, setIsOcrAnalyzing] = useState(false);

    // Map step to TiquinhoState
    const tiquinhoState = useMemo<TiquinhoState>(() => {
        if (isOcrAnalyzing) return "ocr_analyzing";
        if (hasError) return "error";
        if (step === 0 && plate.length === 0) return "greeting";
        if (step === 0) return "idle";
        if (step === 1) return "plate_valid";
        if (step === 2) return "loading_vehicle";
        if (step === 3) return "data_loaded";
        return "idle";
    }, [step, plate, hasError, isOcrAnalyzing]);

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

        const updated = [newVehicle, ...savedVehicles].slice(0, 5);
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

    // When plate changes - show IPVA dates immediately but don't fetch vehicle
    useEffect(() => {
        if (isValidPlate(plate)) {
            const finalDigit = getPlateFinal(plate);
            const dates = getIpvaDates(finalDigit);
            setSchedule(dates);
            setStep(1); // Show dates + "Ver dados" button
            setVehicleData(null); // Reset previous data
            setShowExtraInfo(false);
            setShowFipeInfo(false);
            setHasError(false);
        } else {
            setSchedule(undefined);
            setStep(0);
            setVehicleData(null);
            setHasError(false);
        }
    }, [plate]);

    // Fetch vehicle data when user clicks button
    const handleFetchVehicle = async () => {
        if (!isValidPlate(plate)) return;

        setIsLoadingVehicle(true);
        setStep(2);

        try {
            const response = await vehicleService.lookup({ plate });

            if (response.ok && response.data.basic) {
                setVehicleData(response);
                setHasError(false);
                setStep(3);

                if (response.cache.hit) {
                    toast.info("Dados do cache", { duration: 2000, icon: "💾" });
                }
            } else {
                setHasError(true);
                setStep(1);
                toast.error(response.message ?? "Veículo não encontrado");
            }
        } catch (err) {
            console.error("Vehicle lookup error:", err);
            setHasError(true);
            setStep(1);
            toast.error("Erro ao consultar. Tente novamente.");
        } finally {
            setIsLoadingVehicle(false);
        }
    };

    const handleWhatsappClick = () => {
        window.open(WHATSAPP_LINK, "_blank");
    };

    const setExample = (val: string) => setPlate(val);

    // Scroll detection for Smart CTA
    const [isCtaMinimized, setIsCtaMinimized] = useState(false);
    const [lastScrollY, setLastScrollY] = useState(0);

    useEffect(() => {
        const handleScroll = () => {
            const currentScrollY = window.scrollY;
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

    // Helper to get best FIPE value
    const getBestFipe = () => {
        const fipeData = vehicleData?.data.fipe?.dados;
        if (!fipeData?.length) return null;
        return fipeData.reduce((best, curr) =>
            curr.score > (best?.score ?? 0) ? curr : best
            , fipeData[0]);
    };

    // Render extra info with icons
    const renderExtraInfo = () => {
        const extra = vehicleData?.data.extra;
        if (!extra) return null;

        const infoItems = [
            { icon: Fuel, label: "Combustível", value: extra.combustivel, show: !!extra.combustivel },
            { icon: Gauge, label: "Cilindradas", value: extra.cilindradas ? `${extra.cilindradas} cc` : null, show: !!extra.cilindradas },
            { icon: Users, label: "Passageiros", value: extra.quantidade_passageiro, show: !!extra.quantidade_passageiro },
            { icon: Globe, label: "Nacionalidade", value: extra.nacionalidade, show: !!extra.nacionalidade },
            { icon: Tag, label: "Espécie", value: extra.especie, show: !!extra.especie },
            { icon: Car, label: "Tipo", value: extra.tipo_veiculo, show: !!extra.tipo_veiculo },
            { icon: Tag, label: "Segmento", value: extra.segmento, show: !!extra.segmento },
            { icon: MapPin, label: "Município Faturado", value: extra.municipio, show: !!extra.municipio },
            { icon: Hash, label: "Chassi", value: extra.chassi, show: !!extra.chassi },
        ].filter(item => item.show && item.value);

        // Add restrictions if they exist and are not "SEM RESTRICAO"
        const restrictions = [extra.restricao_1, extra.restricao_2, extra.restricao_3, extra.restricao_4]
            .filter(r => r && !r.toUpperCase().includes("SEM RESTRICAO") && !r.toUpperCase().includes("SEM RESTRIÇÃO"));

        return (
            <div className="space-y-2">
                {infoItems.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-3 text-sm">
                        <item.icon className="w-4 h-4 text-blue-400 flex-shrink-0" />
                        <span className="text-slate-400">{item.label}:</span>
                        <span className="text-white font-medium">{item.value}</span>
                    </div>
                ))}

                {restrictions.length > 0 && (
                    <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg">
                        <div className="flex items-center gap-2 text-amber-400 text-sm font-medium mb-1">
                            <ShieldCheck className="w-4 h-4" />
                            Restrições
                        </div>
                        {restrictions.map((r, idx) => (
                            <p key={idx} className="text-amber-300 text-xs">{r}</p>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    // Render FIPE info
    const renderFipeInfo = () => {
        const fipeData = vehicleData?.data.fipe?.dados;
        if (!fipeData?.length) return null;

        const sortedFipe = [...fipeData].sort((a, b) => b.score - a.score);
        const bestMatch = sortedFipe[0];

        return (
            <div className="space-y-3">
                {/* Best match highlighted */}
                <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/30 rounded-xl">
                    <div className="flex items-center gap-2 text-green-400 text-xs font-medium mb-2">
                        <DollarSign className="w-4 h-4" />
                        Melhor Correspondência (Score: {bestMatch.score}%)
                    </div>
                    <p className="text-white font-semibold text-lg">{bestMatch.texto_valor}</p>
                    <p className="text-slate-400 text-sm mt-1">{bestMatch.texto_modelo}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {bestMatch.mes_referencia}
                        </span>
                        <span className="flex items-center gap-1">
                            <Fuel className="w-3 h-3" />
                            {bestMatch.combustivel}
                        </span>
                        <span className="flex items-center gap-1">
                            <Hash className="w-3 h-3" />
                            FIPE: {bestMatch.codigo_fipe}
                        </span>
                    </div>
                </div>

                {/* Other matches */}
                {sortedFipe.length > 1 && (
                    <div className="space-y-2">
                        <p className="text-xs text-slate-500 font-medium">Outras correspondências:</p>
                        {sortedFipe.slice(1, 4).map((fipe, idx) => (
                            <div key={idx} className="p-3 bg-slate-800/50 rounded-lg flex items-center justify-between">
                                <div>
                                    <p className="text-white text-sm font-medium">{fipe.texto_valor}</p>
                                    <p className="text-slate-400 text-xs truncate max-w-[200px]">{fipe.texto_modelo}</p>
                                </div>
                                <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                    {fipe.score}%
                                </span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

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
                            <p className="text-slate-400 text-sm py-2">Nenhum veículo salvo ainda.</p>
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
                    <p className="text-slate-400 text-sm font-medium">Digite sua placa e veja IPVA + licenciamento.</p>
                </div>

                <div className="mb-6 relative z-20">
                    <PlateInput
                        value={plate}
                        onChange={setPlate}
                        isValid={step >= 1}
                        isLoading={isLoadingVehicle}
                        hasError={hasError}
                        onOcrClick={() => setShowOcrSheet(true)}
                    />
                </div>

                {step === 0 && (
                    <div className="flex gap-2 justify-center mb-8 animate-in fade-in duration-700 delay-150">
                        <button
                            onClick={() => setExample("OZL7H33")}
                            className="bg-slate-800/50 hover:bg-slate-700/80 border border-slate-700/50 backdrop-blur-sm text-slate-300 px-4 py-2 rounded-full text-xs font-medium flex items-center gap-2 transition-all hover:scale-105 active:scale-95 group"
                        >
                            <Dices className="w-4 h-4 text-blue-400 group-hover:rotate-180 transition-transform duration-500" />
                            Preencher exemplo
                        </button>
                    </div>
                )}

                {/* Tiquinho Assistant - Auto-sticky when scrolling out of view */}
                <div className="mb-6">
                    <TiquinhoAssistant state={tiquinhoState} />
                </div>

                {/* Car Loading Animation - Show during vehicle data fetch */}
                {step === 2 && (
                    <div className="animate-in fade-in zoom-in duration-300">
                        <CarLoadingAnimation />
                    </div>
                )}

                {/* RESULTS - Show when plate is valid */}
                {schedule && step >= 1 && (
                    <div className="flex flex-col gap-6">

                        {/* IPVA DATES */}
                        <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards">
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <CalendarDays className="w-5 h-5 text-blue-500" />
                                    Vencimentos <span className="text-slate-500 text-sm font-normal">(Final {getPlateFinal(plate)})</span>
                                </h3>

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

                        {/* BUTTON TO FETCH VEHICLE DATA - Only show if not fetched yet */}
                        {step === 1 && (
                            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500">
                                <button
                                    onClick={handleFetchVehicle}
                                    disabled={isLoadingVehicle}
                                    className="w-full flex items-center justify-center gap-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold py-4 rounded-xl shadow-lg shadow-blue-500/20 transition-all duration-300 transform hover:scale-[1.02] active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                    {isLoadingVehicle ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Buscando dados...
                                        </>
                                    ) : (
                                        <>
                                            <Search className="w-5 h-5" />
                                            Ver dados do veículo
                                        </>
                                    )}
                                </button>
                                <p className="text-center text-xs text-slate-500 mt-2">
                                    Consulta marca, modelo, FIPE e mais detalhes
                                </p>
                            </div>
                        )}

                        {/* VEHICLE DATA - Show after fetching */}
                        {step >= 3 && vehicleData?.data.basic && (
                            <div className="animate-in slide-in-from-bottom-8 fade-in duration-500 fill-mode-forwards">
                                <div className="bg-gradient-to-br from-slate-800/80 to-slate-900/80 backdrop-blur-md rounded-2xl border border-white/10 overflow-hidden shadow-xl">

                                    {/* Header with Logo */}
                                    <div className="p-5 flex items-center gap-4 border-b border-white/5">
                                        {vehicleData.data.basic.logoUrl && (
                                            <div className="w-16 h-16 rounded-xl bg-white flex items-center justify-center p-2 shadow-lg">
                                                <img
                                                    src={vehicleData.data.basic.logoUrl}
                                                    alt={vehicleData.data.basic.brand ?? "Logo"}
                                                    className="w-full h-full object-contain"
                                                    onError={(e) => {
                                                        (e.target as HTMLImageElement).style.display = 'none';
                                                    }}
                                                />
                                            </div>
                                        )}
                                        <div className="flex-1">
                                            <h3 className="text-white font-bold text-lg leading-tight">
                                                {vehicleData.data.basic.brand}
                                            </h3>
                                            <p className="text-blue-400 font-medium">
                                                {vehicleData.data.basic.model}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Basic Info Grid */}
                                    <div className="p-5 grid grid-cols-2 gap-4">
                                        <div className="flex items-center gap-2">
                                            <Calendar className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Ano</p>
                                                <p className="text-white font-medium">
                                                    {vehicleData.data.basic.ano ?? vehicleData.data.extra?.ano_fabricacao ?? "-"}/
                                                    {vehicleData.data.basic.anoModelo ?? vehicleData.data.extra?.ano_modelo ?? "-"}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Palette className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Cor</p>
                                                <p className="text-white font-medium">{vehicleData.data.basic.color ?? "-"}</p>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <MapPin className="w-4 h-4 text-slate-400" />
                                            <div>
                                                <p className="text-xs text-slate-500">Cidade/UF</p>
                                                <p className="text-white font-medium">
                                                    {vehicleData.data.basic.municipio ?? "-"}/{vehicleData.data.basic.uf ?? "-"}
                                                </p>
                                            </div>
                                        </div>

                                        {vehicleData.data.extra?.combustivel && (
                                            <div className="flex items-center gap-2">
                                                <Fuel className="w-4 h-4 text-slate-400" />
                                                <div>
                                                    <p className="text-xs text-slate-500">Combustível</p>
                                                    <p className="text-white font-medium text-sm">{vehicleData.data.extra.combustivel}</p>
                                                </div>
                                            </div>
                                        )}
                                    </div>

                                    {/* FIPE Value - Best Match */}
                                    {getBestFipe() && (
                                        <div className="px-5 pb-4">
                                            <div className="p-4 bg-gradient-to-r from-green-500/10 to-emerald-500/10 border border-green-500/20 rounded-xl">
                                                <div className="flex items-center justify-between">
                                                    <div>
                                                        <p className="text-xs text-green-400 font-medium flex items-center gap-1">
                                                            <DollarSign className="w-3 h-3" />
                                                            Valor FIPE
                                                        </p>
                                                        <p className="text-white font-bold text-xl">{getBestFipe()?.texto_valor}</p>
                                                    </div>
                                                    <div className="text-right">
                                                        <span className="text-xs text-slate-500 bg-slate-700/50 px-2 py-1 rounded">
                                                            {getBestFipe()?.score}% match
                                                        </span>
                                                    </div>
                                                </div>
                                                <p className="text-xs text-slate-400 mt-1">{getBestFipe()?.mes_referencia}</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Expandable Extra Info */}
                                    {vehicleData.data.extra && Object.keys(vehicleData.data.extra).length > 0 && (
                                        <div className="border-t border-white/5">
                                            <button
                                                onClick={() => setShowExtraInfo(!showExtraInfo)}
                                                className="w-full px-5 py-3 flex items-center justify-between text-slate-400 hover:bg-white/5 transition-colors"
                                            >
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <Car className="w-4 h-4" />
                                                    Informações detalhadas
                                                </span>
                                                {showExtraInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            {showExtraInfo && (
                                                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                                                    {renderExtraInfo()}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Expandable FIPE List */}
                                    {vehicleData.data.fipe?.dados && vehicleData.data.fipe.dados.length > 1 && (
                                        <div className="border-t border-white/5">
                                            <button
                                                onClick={() => setShowFipeInfo(!showFipeInfo)}
                                                className="w-full px-5 py-3 flex items-center justify-between text-slate-400 hover:bg-white/5 transition-colors"
                                            >
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <DollarSign className="w-4 h-4" />
                                                    Todas referências FIPE ({vehicleData.data.fipe.dados.length})
                                                </span>
                                                {showFipeInfo ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                                            </button>
                                            {showFipeInfo && (
                                                <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-200">
                                                    {renderFipeInfo()}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {step >= 1 && (
                            <div className="text-[10px] text-slate-500 text-center pb-24 px-4 leading-relaxed opacity-60 animate-in fade-in duration-500">
                                Datas conforme tabela oficial SC. Consulte débitos completos via WhatsApp.
                            </div>
                        )}
                    </div>
                )}

            </main>

            {/* CTA - FIXED ABOVE TAB BAR */}
            {step >= 1 && (
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

                            <Icon icon="mdi:whatsapp" width={isCtaMinimized ? "20" : "24"} height={isCtaMinimized ? "20" : "24"} className="text-white relative z-10 transition-all" />

                            <span className="relative z-10 whitespace-nowrap">
                                Consultar débitos
                            </span>

                            {!isCtaMinimized && (
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform relative z-10" />
                            )}
                        </button>

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

            {/* Plate OCR Sheet */}
            <PlateOcrSheet
                isOpen={showOcrSheet}
                onClose={() => setShowOcrSheet(false)}
                onPlateSelected={(recognizedPlate) => {
                    setPlate(recognizedPlate);
                    setShowOcrSheet(false);
                }}
            />

        </div>
    );
};

export default VehicleConsultationPage;
