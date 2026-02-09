// ======================================================
// TopicActionMenu - Dropdown menu for topic actions
// ======================================================

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Bookmark,
    Link2,
    Flag,
    EyeOff,
    Ban,
    MapPin,
    X
} from 'lucide-react';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';

interface TopicActionMenuProps {
    topicId: string;
    topicTitle?: string;
    topicText?: string;
    bairroId?: string;
    isAnonymous?: boolean;
    children: React.ReactNode;
    onSave?: () => void;
    onHide?: () => void;
    onReport?: () => void;
    onBlock?: () => void;
    onConvertToObservation?: () => void;
}

export function TopicActionMenu({
    topicId,
    topicTitle,
    topicText,
    bairroId,
    isAnonymous,
    children,
    onSave,
    onHide,
    onReport,
    onBlock,
    onConvertToObservation,
}: TopicActionMenuProps) {
    const { toast } = useToast();
    const [open, setOpen] = useState(false);

    const handleCopyLink = async () => {
        const url = `${window.location.origin}/topico/${topicId}`;
        await navigator.clipboard.writeText(url);
        toast({
            title: 'Link copiado!',
            description: 'O link foi copiado para a área de transferência.',
        });
        setOpen(false);
    };

    const handleSave = () => {
        onSave?.();
        toast({
            title: 'Observação salva',
            description: 'Você pode encontrá-la nos salvos.',
        });
        setOpen(false);
    };

    const handleHide = () => {
        onHide?.();
        toast({
            title: 'Observação oculta',
            description: 'Você não verá mais esta observação.',
        });
        setOpen(false);
    };

    const handleReport = () => {
        onReport?.();
        toast({
            title: 'Denúncia enviada',
            description: 'Obrigado por ajudar a manter a comunidade segura.',
        });
        setOpen(false);
    };

    const handleBlock = () => {
        onBlock?.();
        toast({
            title: 'Usuário bloqueado',
            description: 'Você não verá mais publicações desta pessoa.',
        });
        setOpen(false);
    };

    const handleConvertToObservation = () => {
        onConvertToObservation?.();
        setOpen(false);
    };

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                {children}
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl">
                <DropdownMenuItem
                    onClick={handleSave}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                >
                    <Bookmark className="w-4 h-4" />
                    <span>Salvar</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleCopyLink}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                >
                    <Link2 className="w-4 h-4" />
                    <span>Copiar link</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleConvertToObservation}
                    className="flex items-center gap-3 py-3 cursor-pointer text-primary"
                >
                    <MapPin className="w-4 h-4" />
                    <span>Virar Observação no Mapa</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator />

                <DropdownMenuItem
                    onClick={handleHide}
                    className="flex items-center gap-3 py-3 cursor-pointer"
                >
                    <EyeOff className="w-4 h-4" />
                    <span>Ocultar este assunto</span>
                </DropdownMenuItem>

                <DropdownMenuItem
                    onClick={handleReport}
                    className="flex items-center gap-3 py-3 cursor-pointer text-orange-600"
                >
                    <Flag className="w-4 h-4" />
                    <span>Denunciar</span>
                </DropdownMenuItem>

                {!isAnonymous && (
                    <DropdownMenuItem
                        onClick={handleBlock}
                        className="flex items-center gap-3 py-3 cursor-pointer text-red-600"
                    >
                        <Ban className="w-4 h-4" />
                        <span>Bloquear usuário</span>
                    </DropdownMenuItem>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}

export default TopicActionMenu;
