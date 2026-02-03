import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Camera,
    RefreshCw,
    X,
    AlertTriangle,
    SwitchCamera,
    Loader2,
    ImageOff,
    Settings,
    ShieldAlert,
    CheckCircle,
    Info,
    ImagePlus,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { StepHeader } from './HelpTooltip';
import type { ReportDraft, CapturedImage, CameraState } from '@/types/report';
import { generateUUID } from '@/lib/uuid';

interface StepCameraProps {
    draft: ReportDraft;
    onUpdate: (updates: Partial<ReportDraft>) => void;
    onNext: () => void;
    onBack: () => void;
}

const MAX_IMAGES = 3;

export function StepCamera({ draft, onUpdate, onNext, onBack }: StepCameraProps) {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [cameraState, setCameraState] = useState<CameraState>({
        status: 'idle',
        facingMode: 'environment',
        stream: null,
    });
    const [isCapturing, setIsCapturing] = useState(false);

    const startCamera = useCallback(async () => {
        // Check if getUserMedia is available
        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
            setCameraState(prev => ({
                ...prev,
                status: 'error',
                errorMessage: 'Seu navegador não suporta acesso à câmera. Tente usar Chrome, Safari ou Firefox.',
            }));
            return;
        }

        setCameraState(prev => ({ ...prev, status: 'requesting' }));

        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode: cameraState.facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 },
                },
                audio: false,
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                await videoRef.current.play();
            }

            setCameraState(prev => ({
                ...prev,
                status: 'active',
                stream,
                errorMessage: undefined,
            }));
        } catch (error) {
            console.error('Camera error:', error);

            if (error instanceof DOMException) {
                if (error.name === 'NotAllowedError') {
                    setCameraState(prev => ({
                        ...prev,
                        status: 'denied',
                        errorMessage: 'Você não permitiu o acesso à câmera.',
                    }));
                } else if (error.name === 'NotFoundError') {
                    setCameraState(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: 'Nenhuma câmera foi encontrada no seu dispositivo.',
                    }));
                } else if (error.name === 'NotReadableError') {
                    setCameraState(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: 'A câmera está sendo usada por outro aplicativo. Feche outros apps e tente novamente.',
                    }));
                } else if (error.name === 'OverconstrainedError') {
                    setCameraState(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: 'Sua câmera não atende aos requisitos. Tentando configuração alternativa...',
                    }));
                    // Try with less constraints
                    try {
                        const fallbackStream = await navigator.mediaDevices.getUserMedia({
                            video: true,
                            audio: false,
                        });
                        if (videoRef.current) {
                            videoRef.current.srcObject = fallbackStream;
                            await videoRef.current.play();
                        }
                        setCameraState(prev => ({
                            ...prev,
                            status: 'active',
                            stream: fallbackStream,
                            errorMessage: undefined,
                        }));
                    } catch {
                        setCameraState(prev => ({
                            ...prev,
                            status: 'error',
                            errorMessage: 'Não foi possível acessar sua câmera.',
                        }));
                    }
                } else {
                    setCameraState(prev => ({
                        ...prev,
                        status: 'error',
                        errorMessage: 'Ocorreu um erro ao acessar a câmera. Tente novamente.',
                    }));
                }
            } else {
                setCameraState(prev => ({
                    ...prev,
                    status: 'error',
                    errorMessage: 'Erro desconhecido ao acessar a câmera.',
                }));
            }
        }
    }, [cameraState.facingMode]);

    const stopCamera = useCallback(() => {
        if (cameraState.stream) {
            cameraState.stream.getTracks().forEach(track => track.stop());
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
        setCameraState(prev => ({
            ...prev,
            status: 'idle',
            stream: null,
        }));
    }, [cameraState.stream]);

    // Start camera on mount only if we have less than max images
    useEffect(() => {
        if (draft.images.length < MAX_IMAGES && cameraState.status === 'idle') {
            startCamera();
        }
        return () => {
            if (cameraState.stream) {
                cameraState.stream.getTracks().forEach(track => track.stop());
            }
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const switchCamera = useCallback(async () => {
        stopCamera();
        setCameraState(prev => ({
            ...prev,
            facingMode: prev.facingMode === 'environment' ? 'user' : 'environment',
        }));
        setTimeout(() => startCamera(), 100);
    }, [startCamera, stopCamera]);

    const captureImage = useCallback(async () => {
        if (!videoRef.current || !canvasRef.current || draft.images.length >= MAX_IMAGES) return;

        setIsCapturing(true);

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (!ctx) {
            setIsCapturing(false);
            return;
        }

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
            (blob) => {
                if (!blob) {
                    setIsCapturing(false);
                    return;
                }

                // Convert Blob to File for FormData compatibility
                const file = new File([blob], `photo_${Date.now()}.jpg`, {
                    type: 'image/jpeg',
                    lastModified: Date.now(),
                });

                const newImage: CapturedImage = {
                    id: generateUUID(),
                    file,
                    previewUrl: URL.createObjectURL(blob),
                    capturedAt: new Date(),
                };

                onUpdate({
                    images: [...draft.images, newImage],
                });

                setIsCapturing(false);

                if (draft.images.length + 1 >= MAX_IMAGES) {
                    stopCamera();
                }
            },
            'image/jpeg',
            0.85
        );
    }, [draft.images, onUpdate, stopCamera]);

    const removeImage = useCallback((imageId: string) => {
        const imageToRemove = draft.images.find(img => img.id === imageId);
        if (imageToRemove) {
            URL.revokeObjectURL(imageToRemove.previewUrl);
        }

        onUpdate({
            images: draft.images.filter(img => img.id !== imageId),
        });

        if (cameraState.status === 'idle' && draft.images.length <= MAX_IMAGES) {
            startCamera();
        }
    }, [draft.images, cameraState.status, onUpdate, startCamera]);

    const retakeImage = useCallback((imageId: string) => {
        removeImage(imageId);
        if (cameraState.status !== 'active') {
            startCamera();
        }
    }, [removeImage, cameraState.status, startCamera]);

    // Handle gallery file upload
    const handleGalleryUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
        const files = e.target.files;
        if (!files || files.length === 0) return;

        const remainingSlots = MAX_IMAGES - draft.images.length;
        const filesToProcess = Array.from(files).slice(0, remainingSlots);

        filesToProcess.forEach((file) => {
            // Validate file type
            if (!file.type.startsWith('image/')) return;

            // Create preview and add to images
            const newImage: CapturedImage = {
                id: generateUUID(),
                file,
                previewUrl: URL.createObjectURL(file),
                capturedAt: new Date(),
            };

            onUpdate({
                images: [...draft.images, newImage],
            });
        });

        // Reset file input
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, [draft.images, onUpdate]);

    const openGallery = useCallback(() => {
        fileInputRef.current?.click();
    }, []);

    return (
        <div className="space-y-4 pb-48">
            <StepHeader
                title="Adicione até 3 fotos"
                subtitle="Tire fotos agora ou escolha da galeria"
                helpTitle="Dicas para boas fotos"
                helpContent={[
                    "Fotografe de perto para mostrar detalhes do problema.",
                    "Inclua uma foto do contexto (rua, número, ponto de referência).",
                    "Evite fotos muito escuras ou desfocadas."
                ]}
            />

            {/* Hidden file input for gallery */}
            <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={handleGalleryUpload}
                className="hidden"
            />

            {/* Tips Card */}
            <Card className="p-4 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800">
                <div className="flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/50">
                        <Info className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div className="space-y-2 text-sm text-blue-700 dark:text-blue-300">
                        <p className="font-medium">Dicas para boas fotos:</p>
                        <ul className="space-y-1 text-blue-600 dark:text-blue-400">
                            <li className="flex items-center gap-2">
                                <Camera className="h-3.5 w-3.5" />
                                <span>1 foto de perto do problema</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ImageOff className="h-3.5 w-3.5" />
                                <span>1 foto mostrando o contexto da rua</span>
                            </li>
                            <li className="flex items-center gap-2">
                                <ShieldAlert className="h-3.5 w-3.5" />
                                <span>Evite se colocar em risco</span>
                            </li>
                        </ul>
                    </div>
                </div>
            </Card>

            {/* Camera View */}
            <div className="relative">
                {/* Video Preview - Active Camera */}
                {cameraState.status === 'active' && draft.images.length < MAX_IMAGES && (
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="relative rounded-2xl overflow-hidden bg-muted aspect-[4/3]"
                    >
                        {/* Video preview - iOS compatibility */}
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            // iOS Safari requires these attributes
                            webkit-playsinline="true"
                            x-webkit-airplay="allow"
                            style={{ backgroundColor: 'transparent' }}
                            className="w-full h-full object-cover"
                        />

                        {/* Camera controls overlay */}
                        <div className="absolute bottom-4 left-0 right-0 flex items-center justify-center gap-4">
                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={switchCamera}
                                className="p-3 rounded-full bg-black/50 text-white backdrop-blur-sm"
                                aria-label="Trocar câmera"
                            >
                                <SwitchCamera className="h-5 w-5" />
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={captureImage}
                                disabled={isCapturing}
                                className={cn(
                                    'p-1 rounded-full bg-white',
                                    isCapturing && 'opacity-50'
                                )}
                                aria-label="Capturar foto"
                            >
                                <div className="h-16 w-16 rounded-full border-4 border-primary flex items-center justify-center">
                                    {isCapturing ? (
                                        <Loader2 className="h-6 w-6 text-primary animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6 text-primary" />
                                    )}
                                </div>
                            </motion.button>

                            <motion.button
                                whileTap={{ scale: 0.9 }}
                                onClick={openGallery}
                                className="p-3 rounded-full bg-black/50 text-white backdrop-blur-sm"
                                aria-label="Escolher da galeria"
                            >
                                <ImagePlus className="h-5 w-5" />
                            </motion.button>
                        </div>

                        {/* Counter */}
                        <div className="absolute top-4 right-4 px-3 py-1.5 rounded-full bg-black/50 text-white text-sm backdrop-blur-sm flex items-center gap-1">
                            <Camera className="h-3.5 w-3.5" />
                            <span>{draft.images.length}/{MAX_IMAGES}</span>
                        </div>
                    </motion.div>
                )}

                {/* Loading - Requesting Camera */}
                {cameraState.status === 'requesting' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="rounded-2xl bg-muted aspect-[4/3] flex flex-col items-center justify-center p-6 text-center"
                    >
                        <div className="p-4 rounded-full bg-primary/10 mb-4">
                            <Loader2 className="h-8 w-8 text-primary animate-spin" />
                        </div>
                        <p className="font-medium mb-1">Iniciando câmera...</p>
                        <p className="text-sm text-muted-foreground">
                            Se aparecer uma mensagem, toque em "Permitir"
                        </p>
                    </motion.div>
                )}

                {/* Permission Denied */}
                {cameraState.status === 'denied' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-6 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
                                    <ShieldAlert className="h-8 w-8 text-amber-600 dark:text-amber-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-amber-800 dark:text-amber-300">
                                    Câmera bloqueada
                                </h3>
                                <p className="text-sm text-amber-700 dark:text-amber-400 mt-2 mb-4">
                                    {cameraState.errorMessage}
                                </p>

                                <Card className="w-full p-4 bg-white dark:bg-background border-amber-200 dark:border-amber-700">
                                    <p className="font-medium text-sm mb-3 flex items-center gap-2">
                                        <Settings className="h-4 w-4" />
                                        Como permitir o acesso:
                                    </p>
                                    <ol className="text-left text-sm space-y-2 text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">1.</span>
                                            <span>Olhe na barra de endereço do navegador</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">2.</span>
                                            <span>Clique no ícone de cadeado ou câmera</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">3.</span>
                                            <span>Mude "Câmera" para "Permitir"</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <span className="font-bold text-primary">4.</span>
                                            <span>Recarregue a página ou toque no botão abaixo</span>
                                        </li>
                                    </ol>
                                </Card>

                                <Button
                                    variant="outline"
                                    className="mt-4 w-full"
                                    onClick={startCamera}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar novamente
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Generic Error (no camera found, in use, etc) */}
                {cameraState.status === 'error' && (
                    <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <Card className="p-6 border-red-200 bg-red-50 dark:bg-red-950/20 dark:border-red-800">
                            <div className="flex flex-col items-center text-center">
                                <div className="p-4 rounded-full bg-red-100 dark:bg-red-900/30 mb-4">
                                    <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
                                </div>
                                <h3 className="font-semibold text-lg text-red-800 dark:text-red-300">
                                    Problema com a câmera
                                </h3>
                                <p className="text-sm text-red-700 dark:text-red-400 mt-2 mb-4">
                                    {cameraState.errorMessage}
                                </p>

                                <Card className="w-full p-4 bg-white dark:bg-background border-red-200 dark:border-red-700">
                                    <p className="font-medium text-sm mb-3">O que você pode fazer:</p>
                                    <ul className="text-left text-sm space-y-2 text-muted-foreground">
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Verifique se seu dispositivo tem câmera</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Feche outros aplicativos que usam a câmera</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Tente acessar pelo celular em vez do computador</span>
                                        </li>
                                        <li className="flex items-start gap-2">
                                            <CheckCircle className="h-4 w-4 text-green-500 shrink-0 mt-0.5" />
                                            <span>Você pode continuar sem foto (opcional)</span>
                                        </li>
                                    </ul>
                                </Card>

                                <Button
                                    variant="outline"
                                    className="mt-4 w-full"
                                    onClick={startCamera}
                                >
                                    <RefreshCw className="h-4 w-4 mr-2" />
                                    Tentar novamente
                                </Button>
                            </div>
                        </Card>
                    </motion.div>
                )}

                {/* Hidden canvas for capture */}
                <canvas ref={canvasRef} className="hidden" />
            </div>

            {/* Captured Images Grid */}
            {draft.images.length > 0 && (
                <div className="space-y-3">
                    <p className="text-sm font-medium flex items-center gap-2">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        Fotos capturadas ({draft.images.length}/{MAX_IMAGES})
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        <AnimatePresence mode="popLayout">
                            {draft.images.map((image, index) => (
                                <motion.div
                                    key={image.id}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    exit={{ opacity: 0, scale: 0.8 }}
                                    layout
                                    className="relative aspect-square rounded-xl overflow-hidden bg-muted"
                                >
                                    <img
                                        src={image.previewUrl}
                                        alt={`Foto ${index + 1}`}
                                        className="w-full h-full object-cover"
                                    />

                                    <div className="absolute inset-x-0 bottom-0 p-2 bg-gradient-to-t from-black/70 to-transparent">
                                        <div className="flex justify-center gap-2">
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => retakeImage(image.id)}
                                                className="px-2 py-1 text-xs bg-white/20 text-white rounded-md backdrop-blur-sm flex items-center gap-1"
                                            >
                                                <RefreshCw className="h-3 w-3" />
                                                Refazer
                                            </motion.button>
                                            <motion.button
                                                whileTap={{ scale: 0.9 }}
                                                onClick={() => removeImage(image.id)}
                                                className="px-2 py-1 text-xs bg-red-500/80 text-white rounded-md flex items-center gap-1"
                                            >
                                                <X className="h-3 w-3" />
                                                Remover
                                            </motion.button>
                                        </div>
                                    </div>

                                    <div className="absolute top-2 left-2 h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold flex items-center justify-center">
                                        {index + 1}
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>

                        {/* Empty slots */}
                        {Array.from({ length: MAX_IMAGES - draft.images.length }).map((_, index) => (
                            <div
                                key={`empty-${index}`}
                                className="aspect-square rounded-xl border-2 border-dashed border-muted-foreground/30 flex flex-col items-center justify-center gap-1"
                            >
                                <Camera className="h-5 w-5 text-muted-foreground/30" />
                                <span className="text-xs text-muted-foreground/50">Vazio</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* All slots filled message */}
            {draft.images.length >= MAX_IMAGES && (
                <Card className="p-4 text-center bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800">
                    <div className="flex items-center justify-center gap-2 text-green-700 dark:text-green-300">
                        <CheckCircle className="h-5 w-5" />
                        <span className="font-medium">Você tirou {MAX_IMAGES} fotos. Pronto para continuar!</span>
                    </div>
                </Card>
            )}

            {/* No photos warning */}
            {draft.images.length === 0 && (cameraState.status === 'error' || cameraState.status === 'denied') && (
                <Card className="p-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                    <div className="flex items-start gap-3">
                        <AlertTriangle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="font-medium text-amber-800 dark:text-amber-300">Continuar sem foto?</p>
                            <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                                Fotos ajudam muito a identificar o problema, mas você pode continuar sem elas.
                            </p>
                        </div>
                    </div>
                </Card>
            )}

            {/* Fixed Footer */}
            <div className="fixed bottom-0 left-0 right-0 p-4 pb-24 bg-background/95 backdrop-blur-lg border-t z-10">
                <div className="flex gap-3 max-w-lg mx-auto">
                    <Button
                        variant="outline"
                        size="lg"
                        className="h-14 rounded-2xl flex-1 text-base"
                        onClick={() => {
                            stopCamera();
                            onBack();
                        }}
                    >
                        Voltar
                    </Button>
                    <Button
                        size="lg"
                        className="h-14 rounded-2xl flex-[2] text-base font-semibold"
                        onClick={() => {
                            stopCamera();
                            onNext();
                        }}
                    >
                        Continuar
                        {draft.images.length === 0 && (
                            <span className="text-xs ml-2 opacity-70">(sem foto)</span>
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

