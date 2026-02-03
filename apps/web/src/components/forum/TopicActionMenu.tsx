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
    isAnonymous?: boolean;
    children: React.ReactNode;
    onSave?: () => void;
    onHide?: () => void;
    onReport?: () => void;
    onBlock?: () => void;
}

export function TopicActionMenu({
    topicId,
    isAnonymous,
    children,
    onSave,
    onHide,
    onReport,
    onBlock,
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
            title: 'Tópico salvo',
            description: 'Você pode encontrá-lo nos salvos.',
        });
        setOpen(false);
    };

    const handleHide = () => {
        onHide?.();
        toast({
            title: 'Tópico oculto',
            description: 'Você não verá mais este tópico.',
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
