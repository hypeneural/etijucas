import React, { useState, useEffect } from "react";
import { PlateInput } from "../features/vehicle-consult/components/PlateInput";
import { MascotBubble, MascotState } from "../features/vehicle-consult/components/MascotBubble";
import { DebtCards } from "../features/vehicle-consult/components/DebtCards";
import { VehicleCard } from "../features/vehicle-consult/components/VehicleCard";
import { isValidPlate, getPlateFinal, formatPlateVisual } from "../domain/vehicle/plate";
import { getIpvaDates, IpvaScheduleDates } from "../domain/vehicle/scheduleSC";
import { getConsultationLink, getNotFoundLink, getShareLink } from "../domain/vehicle/whatsapp";
import { SwipeableItem } from "../components/ui/SwipeableList";
import { toast } from "sonner";
import { cn } from "../lib/utils";

// Mock Data Service
const fetchVehicleData = async (plate: string) => {
    return new Promise((resolve, reject) => {
        setTimeout(() => {
            if (plate.endsWith("000")) {
                reject("Veículo não encontrado");
            } else {
                resolve({
                    brand: "HONDA",
                    model: "CIVIC EXL CVT",
                    yearFab: "2021",
                    yearMod: "2022",
                    color: "Prata",
                    fuel: "Flex",
                    plate: plate,
                    city: "TIJUCAS",
                    state: "SC"
                });
            }
        }, 1500);
    });
};

interface SavedVehicle {
    plate: string;
    addedAt: number;
    finalDigit: number;
}

const VehicleConsultationPage: React.FC = () => {
    const [plate, setPlate] = useState("");
    const [status, setStatus] = useState<MascotState>("empty");
    const [schedule, setSchedule] = useState<IpvaScheduleDates | undefined>(undefined);
    const [vehicleData, setVehicleData] = useState<any>(null);
    const [showResults, setShowResults] = useState(false);
    const [savedVehicles, setSavedVehicles] = useState<SavedVehicle[]>([]);
    const [showGarage, setShowGarage] = useState(false);

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

    // Instant Partial Result Logic
    useEffect(() => {
        if (isValidPlate(plate)) {
            const finalDigit = getPlateFinal(plate);
            const dates = getIpvaDates(finalDigit);
            setSchedule(dates);
            setStatus("valid");

            if (!showResults || vehicleData?.plate !== plate) {
                handleSearch(plate);
            }
        } else {
            if (plate.length === 0) setStatus("empty");
            if (plate.length < 7) {
                setSchedule(undefined);
                setShowResults(false);
                setVehicleData(null);
            }
        }
    }, [plate]);

    const handleSearch = async (currentPlate: string) => {
        setShowResults(true);
        setStatus("loading");
        setVehicleData(null);
        setShowGarage(false);

        try {
            const data = await fetchVehicleData(currentPlate);
            setVehicleData(data);
            setStatus("valid");
        } catch (err) {
            setStatus("error");
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

    return (
        <div className="min-h-screen bg-[#101623] pb-32 font-sans relative overflow-x-hidden selection:bg-blue-500/30">

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
                    <span className="material-symbols-outlined text-blue-500">garage_home</span>
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
                            <span className="material-symbols-outlined text-yellow-400">star</span>
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
                                        rightIcon="delete"
                                        rightActionColor="bg-red-500/80"
                                        leftIcon="search"
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
                                            <span className="material-symbols-outlined text-slate-500">chevron_right</span>
                                        </div>
                                    </SwipeableItem>
                                ))}
                            </div>
                        )}
                        <div className="mt-2 text-[10px] text-slate-500 text-center flex items-center justify-center gap-2 opacity-50">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-xs">arrow_back</span> Swipe</span>
                            <span>para ações</span>
                            <span className="flex items-center gap-1">Swipe <span className="material-symbols-outlined text-xs">arrow_forward</span></span>
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
                    />
                </div>

                {!showResults && (
                    <div className="flex gap-2 justify-center mb-8 animate-in fade-in duration-700 delay-150">
                        <button onClick={() => setExample("ABC1234")} className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">Carro Antigo</button>
                        <button onClick={() => setExample("ABC1D23")} className="px-3 py-1.5 rounded-full bg-slate-800/50 border border-slate-700 text-xs text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">Mercosul</button>
                    </div>
                )}

                <div className="mb-6">
                    <MascotBubble state={status} />
                </div>

                {showResults && schedule && (
                    <div className="flex flex-col gap-5 animate-in slide-in-from-bottom-12 fade-in duration-500 fill-mode-forwards">

                        <VehicleCard isLoading={status === "loading"} data={vehicleData} />

                        <div>
                            <div className="flex items-center justify-between mb-3 px-1">
                                <h3 className="text-white font-bold flex items-center gap-2">
                                    <span className="material-symbols-outlined text-blue-500">calendar_month</span>
                                    Vencimentos <span className="text-slate-500 text-sm font-normal">(Final {getPlateFinal(plate)})</span>
                                </h3>
                                <div className="flex gap-2">
                                    {/* Save Button */}
                                    <button
                                        onClick={() => saveVehicle(plate)}
                                        className="text-xs text-yellow-500 hover:text-yellow-400 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-yellow-500/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">star</span>
                                        Salvar
                                    </button>
                                    <button
                                        onClick={handleShare}
                                        className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 font-medium px-2 py-1 rounded hover:bg-blue-500/10 transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-sm">share</span>
                                        Viral
                                    </button>
                                </div>
                            </div>
                            <DebtCards dates={schedule} />
                        </div>

                        <div className="text-[10px] text-slate-500 text-center pb-24 px-4 leading-relaxed opacity-60">
                            Datas conforme tabela oficial SC. Consulte débitos completos para valores exatos.
                            Dados podem variar conforme situação do veículo.
                        </div>
                    </div>
                )}

            </main>

            <div className="fixed bottom-0 left-0 w-full z-50 p-4 bg-gradient-to-t from-[#101623] via-[#101623]/95 to-transparent backdrop-blur-[2px]">
                <div className="max-w-md mx-auto flex flex-col gap-2">
                    <button
                        onClick={handleWhatsappClick}
                        className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold h-14 rounded-xl shadow-[0_0_20px_rgba(37,211,102,0.3)] transition-all transform active:scale-95 group"
                    >
                        <img src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg" className="w-6 h-6 invert brightness-0" alt="Whatsapp" />
                        <span>
                            {status === "error" ? "Não achou? Falar com Titico" : "Consultar débitos no WhatsApp"}
                        </span>
                        <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>

                    {status !== "error" && (
                        <div className="flex items-center justify-center gap-2 text-[10px] text-slate-400 font-medium opacity-80">
                            <span className="flex items-center gap-1"><span className="material-symbols-outlined text-[10px] text-green-500">check</span> Resposta rápida</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>Evita multa</span>
                            <span className="w-1 h-1 rounded-full bg-slate-600"></span>
                            <span>Sem enrolação</span>
                        </div>
                    )}
                </div>
            </div>

        </div>
    );
};

export default VehicleConsultationPage;
