// ======================================================
// CommentComposer - Fixed bottom input for comments with image support
// ======================================================

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Loader2, WifiOff, Eye, EyeOff, Image as ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useUploadImage } from '@/hooks/useUploadImage';
import { toast } from 'sonner';

interface CommentComposerProps {
    onSubmit: (text: string, isAnon: boolean, imageUrl?: string) => Promise<void>;
    autoFocus?: boolean;
    placeholder?: string;
    replyTo?: string;
    isSubmitting?: boolean; // External submitting state from mutation
}

export function CommentComposer({
    onSubmit,
    autoFocus = false,
    placeholder = 'Escreva um comentário…',
    replyTo,
    isSubmitting: externalSubmitting = false,
}: CommentComposerProps) {
    const [text, setText] = useState('');
    const [isAnon, setIsAnon] = useState(false);
    const [isSubmittingInternal, setIsSubmittingInternal] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const [imagePreview, setImagePreview] = useState<string | null>(null);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const { isOnline } = useNetworkStatus();
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Image upload hook
    const { uploadAsync, isUploading, isCompressing } = useUploadImage();

    // Combined submitting state
    const isSubmitting = isSubmittingInternal || externalSubmitting || isUploading;

    useEffect(() => {
        if (autoFocus && textareaRef.current) {
            textareaRef.current.focus();
        }
    }, [autoFocus]);

    const handleSubmit = async () => {
        if (!text.trim() || isSubmitting) return;

        setIsSubmittingInternal(true);
        try {
            let imageUrl: string | undefined;

            // Upload image first if selected
            if (selectedFile) {
                try {
                    const result = await uploadAsync(selectedFile);
                    imageUrl = result.url;
                } catch (uploadError) {
                    const message = uploadError instanceof Error ? uploadError.message : 'Erro no upload';
                    toast.error(`Falha no upload: ${message}`);
                    setIsSubmittingInternal(false);
                    return; // Don't proceed if upload fails
                }
            }

            await onSubmit(text.trim(), isAnon, imageUrl);
            setText('');
            setImagePreview(null);
            setSelectedFile(null);

            // Haptic feedback
            if (navigator.vibrate) {
                navigator.vibrate(10);
            }
        } finally {
            setIsSubmittingInternal(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            // Store the file for upload
            setSelectedFile(file);

            // Create preview
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
        <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border safe-bottom z-40">
            {/* Offline indicator */}
            <AnimatePresence>
                {!isOnline && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 text-xs flex items-center gap-2"
                    >
                        <WifiOff className="w-3 h-3" />
                        <span>Sem conexão. Comentário será enviado quando voltar.</span>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Reply indicator */}
            <AnimatePresence>
                {replyTo && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 py-2 bg-muted text-sm text-muted-foreground border-l-4 border-primary"
                    >
                        Respondendo a <strong>{replyTo}</strong>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Image preview */}
            <AnimatePresence>
                {imagePreview && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="px-4 pt-2"
                    >
                        <div className="relative inline-block">
                            <img
                                src={imagePreview}
                                alt="Preview"
                                className="h-20 rounded-lg object-cover"
                            />
                            <button
                                onClick={removeImage}
                                className="absolute -top-1 -right-1 p-1 bg-destructive text-destructive-foreground rounded-full shadow-sm"
                                aria-label="Remover imagem"
                            >
                                <X className="w-3 h-3" />
                            </button>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Input area */}
            <div className="px-4 py-3">
                <div className="flex items-end gap-2">
                    {/* Anon toggle */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setIsAnon(!isAnon)}
                        className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isAnon
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted text-muted-foreground'
                            }`}
                        aria-label={isAnon ? 'Postar com nome' : 'Postar anônimo'}
                        aria-pressed={isAnon}
                    >
                        {isAnon ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </motion.button>

                    {/* Image button */}
                    <motion.button
                        whileTap={{ scale: 0.9 }}
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center bg-muted text-muted-foreground transition-colors hover:bg-muted-foreground/10"
                        aria-label="Anexar imagem"
                    >
                        <ImageIcon className="w-4 h-4" />
                    </motion.button>

                    <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {/* Text input */}
                    <div className="flex-1 relative">
                        <Textarea
                            ref={textareaRef}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            onFocus={() => setIsFocused(true)}
                            onBlur={() => setIsFocused(false)}
                            onKeyDown={handleKeyDown}
                            placeholder={placeholder}
                            className={`min-h-[44px] max-h-[120px] py-3 pr-12 rounded-2xl resize-none text-base transition-all ${isFocused ? 'ring-2 ring-primary' : ''
                                }`}
                            rows={1}
                            maxLength={500}
                        />

                        {/* Character count */}
                        {text.length > 400 && (
                            <span className="absolute right-12 bottom-2 text-xs text-muted-foreground">
                                {text.length}/500
                            </span>
                        )}
                    </div>

                    {/* Submit button */}
                    <motion.div whileTap={{ scale: 0.9 }}>
                        <Button
                            onClick={handleSubmit}
                            disabled={!text.trim() || isSubmitting}
                            size="icon"
                            className="w-10 h-10 rounded-full flex-shrink-0"
                            aria-label="Enviar comentário"
                        >
                            {isSubmitting ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <Send className="w-4 h-4" />
                            )}
                        </Button>
                    </motion.div>
                </div>

                {/* Anon hint */}
                <AnimatePresence>
                    {isAnon && (
                        <motion.p
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: 'auto' }}
                            exit={{ opacity: 0, height: 0 }}
                            className="text-xs text-muted-foreground mt-2 pl-12"
                        >
                            Seu nome não aparecerá no comentário
                        </motion.p>
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
}

export default CommentComposer;
