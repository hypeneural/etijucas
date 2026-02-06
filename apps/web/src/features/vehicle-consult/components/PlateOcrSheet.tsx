/**
 * PlateOcrSheet - Bottom sheet for plate OCR capture
 * Provides camera/gallery options with native-like UX
 */
import React, { useState, useRef } from 'react';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import {
    plateOcrService,
    PlateOcrResult,
    getConfidenceLevel,
    suggestAlternatives,
} from '@/services/plateOcr.service';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import {
    Camera,
    Image,
    Scan,
    Check,
    Edit3,
    X,
    AlertTriangle,
    Loader2,
    ChevronRight,
    RefreshCw,
    Sparkles,
} from 'lucide-react';

interface PlateOcrSheetProps {
    isOpen: boolean;
    onClose: () => void;
    onPlateSelected: (plate: string) => void;
}

type OcrState = 'idle' | 'capturing' | 'analyzing' | 'results' | 'error';

export const PlateOcrSheet: React.FC<PlateOcrSheetProps> = ({
    isOpen,
    onClose,
    onPlateSelected,
}) => {
    const [state, setState] = useState<OcrState>('idle');
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [results, setResults] = useState<PlateOcrResult[]>([]);
    const [selectedPlate, setSelectedPlate] = useState<string | null>(null);
    const [alternatives, setAlternatives] = useState<string[]>([]);
    const [errorMessage, setErrorMessage] = useState<string>('');
    const fileRef = useRef<File | null>(null);

    const resetState = () => {
        setState('idle');
        setImagePreview(null);
        setResults([]);
        setSelectedPlate(null);
        setAlternatives([]);
        setErrorMessage('');
        fileRef.current = null;
    };

    const handleFileSelected = async (file: File) => {
        fileRef.current = file;

        // Create preview URL
        const previewUrl = URL.createObjectURL(file);
        setImagePreview(previewUrl);
        setState('analyzing');

        try {
            const response = await plateOcrService.recognizePlate(file);

            if (response.ok && response.results && response.results.length > 0) {
                setResults(response.results);

                // Auto-select best result
                const best = response.results[0];
                setSelectedPlate(best.plate);

                // Generate O/0 I/1 alternatives
                const alts = suggestAlternatives(best.plate);
                setAlternatives(alts);

                setState('results');
            } else {
                setState('error');
                setErrorMessage(response.message || 'Nenhuma placa encontrada. Tente outra foto.');
            }
        } catch (error) {
            console.error('OCR Error:', error);
            setState('error');
            setErrorMessage('Erro ao processar imagem. Tente novamente.');
        }
    };

    const handleCameraClick = () => {
        setState('capturing');
        plateOcrService.pickImageFromCamera(handleFileSelected);
    };

    const handleGalleryClick = () => {
        setState('capturing');
        plateOcrService.pickImageFromGallery(handleFileSelected);
    };

    const handleConfirm = () => {
        if (selectedPlate) {
            onPlateSelected(selectedPlate);
            toast.success(`Placa ${selectedPlate} selecionada`);
            onClose();
            // Delay reset to avoid flash
            setTimeout(resetState, 300);
        }
    };

    const handleRetry = () => {
        resetState();
    };

    const handleClose = () => {
        onClose();
        setTimeout(resetState, 300);
    };

    return (
        <Sheet open={isOpen} onOpenChange={handleClose}>
            <SheetContent side="bottom" className="bg-slate-900 border-t border-white/10 rounded-t-3xl max-h-[90vh] overflow-y-auto">
                <SheetHeader className="mb-4">
                    <SheetTitle className="text-white text-lg flex items-center gap-2">
                        <Camera className="w-5 h-5 text-blue-400" />
                        Ler placa por foto
                    </SheetTitle>
                </SheetHeader>

                {/* IDLE STATE - Show capture options */}
                {state === 'idle' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        {/* Tips */}
                        <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                            <div className="flex items-start gap-3">
                                <Sparkles className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                                <div className="text-sm text-slate-300">
                                    <p className="font-medium text-white mb-1">Dicas para melhor leitura:</p>
                                    <ul className="space-y-1 text-slate-400">
                                        <li>• Boa iluminação, sem reflexos</li>
                                        <li>• Placa centralizada na foto</li>
                                        <li>• Aproxime-se do veículo</li>
                                    </ul>
                                </div>
                            </div>
                        </div>

                        {/* Capture Buttons */}
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleCameraClick}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl text-white font-medium hover:from-blue-500 hover:to-indigo-500 transition-all active:scale-95"
                            >
                                <Camera className="w-8 h-8" />
                                <span>Tirar foto</span>
                            </button>

                            <button
                                onClick={handleGalleryClick}
                                className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-800 border border-white/10 rounded-xl text-white font-medium hover:bg-slate-700 transition-all active:scale-95"
                            >
                                <Image className="w-8 h-8 text-slate-400" />
                                <span>Galeria</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ANALYZING STATE - Show spinner over preview */}
                {(state === 'capturing' || state === 'analyzing') && (
                    <div className="animate-in fade-in duration-300">
                        <div className="relative rounded-xl overflow-hidden bg-slate-800 aspect-video flex items-center justify-center">
                            {imagePreview ? (
                                <>
                                    <img
                                        src={imagePreview}
                                        alt="Preview"
                                        className="w-full h-full object-cover"
                                    />
                                    {/* Scan overlay */}
                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                        <div className="text-center">
                                            <div className="relative">
                                                <Scan className="w-16 h-16 text-blue-400 animate-pulse" />
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <Loader2 className="w-8 h-8 text-white animate-spin" />
                                                </div>
                                            </div>
                                            <p className="text-white mt-3 font-medium">Analisando...</p>
                                        </div>
                                    </div>
                                    {/* Scan line animation */}
                                    <div className="absolute inset-x-0 h-0.5 bg-gradient-to-r from-transparent via-blue-400 to-transparent animate-scan-line" />
                                </>
                            ) : (
                                <div className="text-center text-slate-400">
                                    <Loader2 className="w-8 h-8 animate-spin mx-auto mb-2" />
                                    <p>Aguardando imagem...</p>
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* RESULTS STATE - Show detected plates */}
                {state === 'results' && results.length > 0 && (
                    <div className="space-y-4 animate-in slide-in-from-bottom-4 duration-300">
                        {/* Preview with box highlight */}
                        {imagePreview && (
                            <div className="relative rounded-xl overflow-hidden">
                                <img
                                    src={imagePreview}
                                    alt="Captured"
                                    className="w-full h-32 object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                                    <span className="text-xs text-slate-300 flex items-center gap-1">
                                        <Check className="w-3 h-3 text-green-400" />
                                        Placa detectada
                                    </span>
                                    <button
                                        onClick={handleRetry}
                                        className="text-xs text-blue-400 flex items-center gap-1"
                                    >
                                        <RefreshCw className="w-3 h-3" />
                                        Nova foto
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Main result */}
                        <div className="space-y-3">
                            <p className="text-sm text-slate-400">Placa reconhecida:</p>

                            {results.map((result, idx) => {
                                const confidence = getConfidenceLevel(result.score);
                                const isSelected = selectedPlate === result.plate;

                                return (
                                    <button
                                        key={idx}
                                        onClick={() => {
                                            setSelectedPlate(result.plate);
                                            setAlternatives(suggestAlternatives(result.plate));
                                        }}
                                        className={cn(
                                            "w-full p-4 rounded-xl border-2 transition-all text-left",
                                            isSelected
                                                ? "bg-blue-500/20 border-blue-500"
                                                : "bg-slate-800 border-white/10 hover:border-white/20"
                                        )}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-2xl font-bold text-white font-mono tracking-wider">
                                                    {result.plate}
                                                </p>
                                                <p className={cn("text-xs font-medium mt-1", confidence.color)}>
                                                    {confidence.label} ({Math.round(result.score * 100)}%)
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center">
                                                    <Check className="w-5 h-5 text-white" />
                                                </div>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}

                            {/* Alternative suggestions (O/0, I/1) */}
                            {alternatives.length > 0 && (
                                <div className="space-y-2">
                                    <p className="text-xs text-slate-500 flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" />
                                        Talvez seja:
                                    </p>
                                    <div className="flex flex-wrap gap-2">
                                        {alternatives.map((alt, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedPlate(alt)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-sm font-mono font-medium transition-all",
                                                    selectedPlate === alt
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-slate-700 text-slate-300 hover:bg-slate-600"
                                                )}
                                            >
                                                {alt}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Candidates from API */}
                            {results[0]?.candidates && results[0].candidates.length > 1 && (
                                <div className="space-y-2 pt-2 border-t border-white/5">
                                    <p className="text-xs text-slate-500">Outras leituras:</p>
                                    <div className="flex flex-wrap gap-2">
                                        {results[0].candidates.slice(1, 4).map((c, idx) => (
                                            <button
                                                key={idx}
                                                onClick={() => setSelectedPlate(c.plate)}
                                                className={cn(
                                                    "px-3 py-1.5 rounded-lg text-xs font-mono transition-all flex items-center gap-1",
                                                    selectedPlate === c.plate
                                                        ? "bg-blue-500 text-white"
                                                        : "bg-slate-800 text-slate-400 hover:bg-slate-700"
                                                )}
                                            >
                                                {c.plate}
                                                <span className="text-slate-500 text-[10px]">
                                                    {Math.round(c.score * 100)}%
                                                </span>
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Confirm Button */}
                        <button
                            onClick={handleConfirm}
                            disabled={!selectedPlate}
                            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-500 disabled:bg-slate-700 disabled:text-slate-500 text-white font-bold py-4 rounded-xl transition-all active:scale-95"
                        >
                            <Check className="w-5 h-5" />
                            Usar esta placa
                        </button>

                        <p className="text-center text-xs text-slate-500">
                            Você poderá editar a placa antes de confirmar
                        </p>
                    </div>
                )}

                {/* ERROR STATE */}
                {state === 'error' && (
                    <div className="space-y-4 animate-in fade-in duration-300">
                        <div className="text-center py-8">
                            <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-4">
                                <X className="w-8 h-8 text-red-400" />
                            </div>
                            <p className="text-white font-medium mb-2">Não foi possível ler a placa</p>
                            <p className="text-slate-400 text-sm">{errorMessage}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <button
                                onClick={handleRetry}
                                className="flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-medium rounded-xl transition-all"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Tentar novamente
                            </button>
                            <button
                                onClick={handleClose}
                                className="flex items-center justify-center gap-2 py-3 bg-slate-700 hover:bg-slate-600 text-white font-medium rounded-xl transition-all"
                            >
                                Digitar placa
                            </button>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    );
};

// Add scan line animation to global styles
const scanLineStyle = `
@keyframes scan-line {
    0% { top: 0; }
    100% { top: 100%; }
}
.animate-scan-line {
    animation: scan-line 1.5s ease-in-out infinite;
}
`;

// Inject style if not already present
if (typeof document !== 'undefined' && !document.getElementById('plate-ocr-styles')) {
    const style = document.createElement('style');
    style.id = 'plate-ocr-styles';
    style.textContent = scanLineStyle;
    document.head.appendChild(style);
}

export default PlateOcrSheet;
