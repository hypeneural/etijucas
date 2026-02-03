// ======================================================
// ContactCard - Smart phone contact card component
// ======================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Phone,
    Copy,
    MessageCircle,
    MapPin,
    Star,
    MoreHorizontal,
    Clock,
    AlertTriangle,
    Shield,
    Heart,
    Building2,
    GraduationCap,
    Wrench,
    Map,
    Check
} from 'lucide-react';
import { PhoneContact, PhoneCategory } from '@/types';
import { formatPhoneDisplay, getTelLink, formatWhatsAppLink } from '@/lib/phoneFormat';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ContactCardProps {
    contact: PhoneContact;
    isFavorite?: boolean;
    onToggleFavorite?: (id: string) => void;
}

// Category icon mapping
const categoryIcons: Record<PhoneCategory, React.ElementType> = {
    emergencias: AlertTriangle,
    seguranca: Shield,
    saude: Heart,
    prefeitura: Building2,
    educacao: GraduationCap,
    utilidades: Wrench,
    turismo: Map,
    defesa_civil: AlertTriangle,
    servicos: Wrench,
    outros: Phone,
};

// Category colors
const categoryColors: Record<PhoneCategory, string> = {
    emergencias: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
    seguranca: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
    saude: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
    prefeitura: 'bg-amber-100 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400',
    educacao: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
    utilidades: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400',
    turismo: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
    defesa_civil: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
    servicos: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
    outros: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export function ContactCard({ contact, isFavorite = false, onToggleFavorite }: ContactCardProps) {
    const { toast } = useToast();
    const [copied, setCopied] = useState(false);

    const Icon = categoryIcons[contact.category] || Phone;
    const colorClass = categoryColors[contact.category] || categoryColors.outros;
    const displayPhone = contact.phone_display || formatPhoneDisplay(contact.phone);

    const handleCopy = async () => {
        try {
            await navigator.clipboard.writeText(contact.phone);
            setCopied(true);
            toast({
                title: 'Número copiado!',
                description: displayPhone,
            });
            setTimeout(() => setCopied(false), 2000);
        } catch {
            toast({
                title: 'Erro ao copiar',
                variant: 'destructive',
            });
        }
    };

    const handleWhatsApp = () => {
        if (contact.whatsapp) {
            window.open(formatWhatsAppLink(contact.whatsapp), '_blank');
        }
    };

    const handleMap = () => {
        if (contact.lat && contact.lng) {
            window.open(`https://maps.google.com/?q=${contact.lat},${contact.lng}`, '_blank');
        } else if (contact.address) {
            window.open(`https://maps.google.com/?q=${encodeURIComponent(contact.address + ', Tijucas SC')}`, '_blank');
        }
    };

    const handleFavorite = () => {
        onToggleFavorite?.(contact.id);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            whileTap={{ scale: 0.99 }}
            className={cn(
                "bg-card rounded-2xl p-4 shadow-sm border border-border/50",
                contact.is_emergency && "border-l-4 border-l-red-500"
            )}
        >
            <div className="flex items-start gap-3">
                {/* Category Icon */}
                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center shrink-0", colorClass)}>
                    <Icon className="w-6 h-6" />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <h3 className="font-semibold text-foreground text-base leading-tight">
                        {contact.name}
                    </h3>

                    {/* Phone */}
                    <p className="text-lg font-medium text-primary mt-0.5">
                        {displayPhone}
                    </p>

                    {/* Info line */}
                    {(contact.neighborhood || contact.hours || contact.subcategory) && (
                        <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                            {contact.subcategory && <span>{contact.subcategory}</span>}
                            {contact.subcategory && (contact.neighborhood || contact.hours) && <span>•</span>}
                            {contact.neighborhood && <span>{contact.neighborhood}</span>}
                            {contact.neighborhood && contact.hours && <span>•</span>}
                            {contact.hours && (
                                <span className="flex items-center gap-0.5">
                                    <Clock className="w-3 h-3" />
                                    {contact.hours}
                                </span>
                            )}
                        </p>
                    )}

                    {/* Badges */}
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {contact.is_emergency && (
                            <Badge variant="destructive" className="text-[10px] px-1.5 py-0 h-5">
                                Emergência
                            </Badge>
                        )}
                        {contact.hours === '24h' && !contact.is_emergency && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                                24h
                            </Badge>
                        )}
                        {contact.is_free && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                                Gratuito
                            </Badge>
                        )}
                        {contact.whatsapp && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400">
                                WhatsApp
                            </Badge>
                        )}
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Call Button - Primary */}
                    <Button
                        asChild
                        size="icon"
                        className="h-11 w-11 rounded-xl bg-primary hover:bg-primary/90"
                    >
                        <a href={getTelLink(contact.phone)}>
                            <Phone className="h-5 w-5" />
                        </a>
                    </Button>

                    {/* More Actions */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl">
                                <MoreHorizontal className="h-5 w-5" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onClick={handleCopy} className="gap-2">
                                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                                {copied ? 'Copiado!' : 'Copiar número'}
                            </DropdownMenuItem>

                            {contact.whatsapp && (
                                <DropdownMenuItem onClick={handleWhatsApp} className="gap-2">
                                    <MessageCircle className="h-4 w-4" />
                                    Abrir WhatsApp
                                </DropdownMenuItem>
                            )}

                            {(contact.address || (contact.lat && contact.lng)) && (
                                <DropdownMenuItem onClick={handleMap} className="gap-2">
                                    <MapPin className="h-4 w-4" />
                                    Ver no mapa
                                </DropdownMenuItem>
                            )}

                            <DropdownMenuItem onClick={handleFavorite} className="gap-2">
                                <Star className={cn("h-4 w-4", isFavorite && "fill-yellow-400 text-yellow-400")} />
                                {isFavorite ? 'Remover favorito' : 'Adicionar favorito'}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </motion.div>
    );
}
