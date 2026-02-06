// ======================================================
// TopicComposerSheet - Create new topic bottom sheet
// ======================================================

import { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    X,
    Camera,
    Image as ImageIcon,
    MapPin,
    Eye,
    EyeOff,
    Send,
    Loader2,
    Check,
    AlertCircle,
    AlertTriangle,
    Lightbulb,
    HelpCircle,
    Bell,
    ThumbsUp,
    MessageSquare,
    Calendar
} from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { TopicCategory } from '@/types';
import { useBairros } from '@/hooks';
import { useUploadImage } from '@/hooks/useUploadImage';
import { toast } from 'sonner';

const categoryOptions: { value: TopicCategory; label: string; icon: React.ReactNode; color: string }[] = [
    { value: 'reclamacao', label: 'Reclamação', icon: <AlertTriangle className="w-4 h-4" />, color: 'bg-red-100 text-red-700 border-red-200' },
    { value: 'sugestao', label: 'Sugestão', icon: <Lightbulb className="w-4 h-4" />, color: 'bg-blue-100 text-blue-700 border-blue-200' },
    { value: 'duvida', label: 'Dúvida', icon: <HelpCircle className="w-4 h-4" />, color: 'bg-purple-100 text-purple-700 border-purple-200' },
    { value: 'alerta', label: 'Alerta', icon: <Bell className="w-4 h-4" />, color: 'bg-orange-100 text-orange-700 border-orange-200' },
    { value: 'elogio', label: 'Elogio', icon: <ThumbsUp className="w-4 h-4" />, color: 'bg-green-100 text-green-700 border-green-200' },
    { value: 'comercio', label: 'Comércio', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
    { value: 'eventos', label: 'Eventos', icon: <Calendar className="w-4 h-4" />, color: 'bg-pink-100 text-pink-700 border-pink-200' },
    { value: 'outros', label: 'Outros', icon: <MessageSquare className="w-4 h-4" />, color: 'bg-gray-100 text-gray-700 border-gray-200' },
];

export interface NewTopicData {
    titulo: string;
    texto: string;
    categoria: TopicCategory;
    bairroId?: string;
    isAnon: boolean;
    fotoUrl?: string;
}

interface TopicComposerSheetProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit: (data: NewTopicData) => Promise<void>;
    defaultBairroId?: string;
}

export function TopicComposerSheet({
    open,
    onOpenChange,
    onSubmit,
    defaultBairroId
}: TopicComposerSheetProps) {
    const [categoria, setCategoria] = useState<TopicCategory | null>(null);
    const [titulo, setTitulo] = useState('');
    const [texto, setTexto] = useState('');
    const [bairroId, setBairroId] = useState(defaultBairroId || '');
    const [isAnon, setIsAnon] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitState, setSubmitState] = useState<'idle' | 'success' | 'error'>('idle');
    const [errors, setErrors] = useState<Record<string, string>>({});

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image upload hook
    const { uploadAsync, isUploading } = useUploadImage();

    // Fetch bairros from API
    const { data: bairros = [], isLoading: isLoadingBairros } = useBairros();

    const validate = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!categoria) {
            newErrors.categoria = 'Escolha um tipo: Reclamação, Sugestão…';
        }
        if (!titulo.trim()) {
            newErrors.titulo = 'Dê um título curto pro pessoal entender rápido';
        } else if (titulo.length < 5) {
            newErrors.titulo = 'O título precisa ter pelo menos 5 caracteres';
        }
        if (!texto.trim()) {
            newErrors.texto = 'Conte mais detalhes sobre o assunto';
        }
        // bairroId é opcional - não validamos mais

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate() || !categoria) return;

        setIsSubmitting(true);
        setSubmitState('idle');

        try {
            let fotoUrl: string | undefined;

            // Upload image first if selected (NEVER send base64!)
            if (selectedFile) {
                try {
                    const result = await uploadAsync(selectedFile);
                    fotoUrl = result.url;
                } catch (uploadError) {
                    const message = uploadError instanceof Error ? uploadError.message : 'Erro no upload';
                    toast.error(`Falha no upload da imagem: ${message}`);
                    setIsSubmitting(false);
                    return; // Don't proceed if upload fails
                }
            }

            await onSubmit({
                titulo: titulo.trim(),
                texto: texto.trim(),
                categoria,
                bairroId: bairroId && bairroId !== 'none' ? bairroId : undefined,
                isAnon,
                fotoUrl, // Now it's a URL from API, not base64!
            });

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate([30, 50, 30]);
            }

            setSubmitState('success');

            // Close after brief success animation
            setTimeout(() => {
                resetForm();
                onOpenChange(false);
            }, 800);
        } catch {
            setSubmitState('error');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resetForm = () => {
        setCategoria(null);
        setTitulo('');
        setTexto('');
        setBairroId(defaultBairroId || '');
        setIsAnon(false);
        setImagePreview(null);
        setSelectedFile(null);
        setErrors({});
        setSubmitState('idle');
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Store file for upload
            setSelectedFile(file);

            // Create preview for UI
            const reader = new FileReader();
            reader.onload = () => {
                setImagePreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const removeImage = () => {
        setImagePreview(null);
        setSelectedFile(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent
                side="bottom"
                className="rounded-t-3xl h-[85vh] flex flex-col p-0 overflow-hidden"
            >
                {/* Header */}
                <SheetHeader className="px-4 py-4 border-b flex-shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-lg font-semibold">Novo tópico</SheetTitle>
                        <button
                            onClick={() => onOpenChange(false)}
                            className="p-2 -mr-2 rounded-full hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
                            aria-label="Fechar"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5">
                    {/* Category selection */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            O que você quer compartilhar?
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {categoryOptions.map((cat) => (
                                <motion.button
                                    key={cat.value}
                                    whileTap={{ scale: 0.95 }}
                                    onClick={() => {
                                        setCategoria(cat.value);
                                        setErrors(e => ({ ...e, categoria: '' }));
                                    }}
                                    className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-all min-h-[44px] ${categoria === cat.value
                                        ? `${cat.color} border-current shadow-sm`
                                        : 'bg-background border-border text-muted-foreground hover:border-foreground/30'
                                        }`}
                                >
                                    {cat.icon}
                                    <span>{cat.label}</span>
                                </motion.button>
                            ))}
                        </div>
                        {errors.categoria && (
                            <p className="text-xs text-red-500 mt-2 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.categoria}
                            </p>
                        )}
                    </div>

                    {/* Title */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Título
                        </label>
                        <Input
                            value={titulo}
                            onChange={(e) => {
                                setTitulo(e.target.value);
                                setErrors(e => ({ ...e, titulo: '' }));
                            }}
                            placeholder="Ex: Buraco na Rua X perto do mercado"
                            className={`h-12 rounded-xl text-base ${errors.titulo ? 'border-red-500' : ''}`}
                            maxLength={100}
                        />
                        {errors.titulo && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.titulo}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {titulo.length}/100
                        </p>
                    </div>

                    {/* Description */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            Conte mais detalhes
                        </label>
                        <Textarea
                            value={texto}
                            onChange={(e) => {
                                setTexto(e.target.value);
                                setErrors(e => ({ ...e, texto: '' }));
                            }}
                            placeholder="Diga onde é e o que está acontecendo…"
                            className={`min-h-[120px] rounded-xl resize-none text-base ${errors.texto ? 'border-red-500' : ''}`}
                            maxLength={500}
                        />
                        {errors.texto && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.texto}
                            </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1 text-right">
                            {texto.length}/500
                        </p>
                    </div>

                    {/* Image preview */}
                    <AnimatePresence>
                        {imagePreview && (
                            <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="relative"
                            >
                                <img
                                    src={imagePreview}
                                    alt="Preview"
                                    className="w-full h-40 object-cover rounded-xl"
                                />
                                <button
                                    onClick={removeImage}
                                    className="absolute top-2 right-2 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
                                    aria-label="Remover imagem"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Media buttons + Bairro */}
                    <div className="flex gap-3">
                        {/* Camera */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                // Open camera
                                if (fileInputRef.current) {
                                    fileInputRef.current.accept = 'image/*';
                                    fileInputRef.current.capture = 'environment';
                                    fileInputRef.current.click();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted-foreground/10 transition-colors min-h-[44px]"
                        >
                            <Camera className="w-5 h-5" />
                            <span className="text-sm font-medium">Câmera</span>
                        </motion.button>

                        {/* Gallery */}
                        <motion.button
                            whileTap={{ scale: 0.95 }}
                            onClick={() => {
                                if (fileInputRef.current) {
                                    fileInputRef.current.accept = 'image/*';
                                    fileInputRef.current.removeAttribute('capture');
                                    fileInputRef.current.click();
                                }
                            }}
                            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-muted-foreground hover:bg-muted-foreground/10 transition-colors min-h-[44px]"
                        >
                            <ImageIcon className="w-5 h-5" />
                            <span className="text-sm font-medium">Galeria</span>
                        </motion.button>

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            onChange={handleFileSelect}
                            className="hidden"
                        />
                    </div>

                    {/* Bairro */}
                    <div>
                        <label className="text-sm font-medium text-foreground mb-2 block">
                            <MapPin className="w-4 h-4 inline mr-1" />
                            Bairro
                        </label>
                        <Select
                            value={bairroId}
                            onValueChange={(val) => {
                                setBairroId(val);
                                setErrors(e => ({ ...e, bairroId: '' }));
                            }}
                        >
                            <SelectTrigger className={`h-12 rounded-xl ${errors.bairroId ? 'border-red-500' : ''}`}>
                                <SelectValue placeholder="Selecione o bairro" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none" className="text-muted-foreground italic">
                                    Não quero informar bairro
                                </SelectItem>
                                {isLoadingBairros ? (
                                    <SelectItem value="loading" disabled>Carregando...</SelectItem>
                                ) : (
                                    bairros.map((b) => (
                                        <SelectItem key={b.id} value={b.id}>
                                            {b.nome}
                                        </SelectItem>
                                    ))
                                )}
                            </SelectContent>
                        </Select>
                        {errors.bairroId && (
                            <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" />
                                {errors.bairroId}
                            </p>
                        )}
                    </div>

                    {/* Anonymous toggle */}
                    <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-xl">
                        <div className="flex items-center gap-3">
                            {isAnon ? (
                                <EyeOff className="w-5 h-5 text-muted-foreground" />
                            ) : (
                                <Eye className="w-5 h-5 text-muted-foreground" />
                            )}
                            <div>
                                <p className="text-sm font-medium text-foreground">Postar anonimamente</p>
                                <p className="text-xs text-muted-foreground">
                                    Seu nome não aparecerá no post
                                </p>
                            </div>
                        </div>
                        <Switch checked={isAnon} onCheckedChange={setIsAnon} />
                    </div>
                </div>

                {/* Submit button */}
                <div className="px-4 py-4 border-t bg-background safe-bottom flex-shrink-0">
                    <Button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="w-full h-14 rounded-2xl text-base font-semibold"
                    >
                        <AnimatePresence mode="wait">
                            {isSubmitting ? (
                                <motion.div
                                    key="loading"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="flex items-center gap-2"
                                >
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    <span>Publicando...</span>
                                </motion.div>
                            ) : submitState === 'success' ? (
                                <motion.div
                                    key="success"
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="flex items-center gap-2 text-green-500"
                                >
                                    <Check className="w-5 h-5" />
                                    <span>Publicado!</span>
                                </motion.div>
                            ) : submitState === 'error' ? (
                                <motion.div
                                    key="error"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <AlertCircle className="w-5 h-5" />
                                    <span>Tentar novamente</span>
                                </motion.div>
                            ) : (
                                <motion.div
                                    key="idle"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    className="flex items-center gap-2"
                                >
                                    <Send className="w-5 h-5" />
                                    <span>Publicar</span>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    );
}

export default TopicComposerSheet;
