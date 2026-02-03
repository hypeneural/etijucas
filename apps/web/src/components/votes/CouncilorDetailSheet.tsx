import { Check, X, Pause, Minus, User, Share2, ExternalLink, FileText } from 'lucide-react';
import { Councilor, VoteType, VOTE_CONFIG } from '@/types/votes';
import { cn } from '@/lib/utils';
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface CouncilorDetailSheetProps {
    councilor: Councilor | null;
    isOpen: boolean;
    onClose: () => void;
    voteTitle?: string;
}

function LargeVoteBadge({ vote }: { vote: VoteType }) {
    const config = VOTE_CONFIG[vote];

    const IconComponent = {
        SIM: Check,
        NAO: X,
        ABSTENCAO: Pause,
        NAO_VOTOU: Minus,
    }[vote];

    return (
        <div className="flex flex-col items-center gap-2">
            <div className={cn(
                'flex items-center justify-center w-16 h-16 rounded-full',
                config.bgColor
            )}>
                <IconComponent className="w-8 h-8 text-white" strokeWidth={2.5} />
            </div>
            <span className={cn('text-sm font-bold uppercase tracking-wide', config.color)}>
                {config.label}
            </span>
        </div>
    );
}

export function CouncilorDetailSheet({
    councilor,
    isOpen,
    onClose,
    voteTitle
}: CouncilorDetailSheetProps) {
    const { toast } = useToast();

    if (!councilor) return null;

    const config = VOTE_CONFIG[councilor.vote];
    const isAbsent = councilor.vote === 'NAO_VOTOU';
    const displayParty = councilor.party === '???' || !councilor.party ? '—' : councilor.party;

    const handleShare = async () => {
        const shareText = `${councilor.name} (${displayParty}) votou ${config.label} em "${voteTitle || 'votação'}"`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: 'Voto do Vereador',
                    text: shareText,
                    url: window.location.href,
                });
            } catch { }
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(`${shareText}\n${window.location.href}`);
            toast({ title: 'Copiado!', description: 'Texto copiado para compartilhar.' });
        }
    };

    return (
        <Sheet open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <SheetContent side="bottom" className="rounded-t-3xl px-6 pb-8 pt-4 max-h-[80vh]">
                {/* Handle bar */}
                <div className="w-12 h-1 bg-muted rounded-full mx-auto mb-4" />

                <SheetHeader className="text-center pb-4">
                    {/* Avatar */}
                    <div className="flex justify-center mb-3">
                        <div className={cn(
                            'relative w-20 h-20 rounded-full overflow-hidden',
                            'border-3',
                            isAbsent ? 'border-gray-200 dark:border-gray-700' : config.borderColor
                        )}>
                            {councilor.photoUrl ? (
                                <img
                                    src={councilor.photoUrl}
                                    alt={councilor.name}
                                    className={cn(
                                        'w-full h-full object-cover',
                                        isAbsent && 'grayscale opacity-70'
                                    )}
                                    onError={(e) => {
                                        e.currentTarget.style.display = 'none';
                                        e.currentTarget.nextElementSibling?.classList.remove('hidden');
                                    }}
                                />
                            ) : null}
                            <div className={cn(
                                'absolute inset-0 bg-muted flex items-center justify-center',
                                councilor.photoUrl ? 'hidden' : ''
                            )}>
                                <User className="w-10 h-10 text-muted-foreground" />
                            </div>
                        </div>
                    </div>

                    <SheetTitle className="text-xl">{councilor.name}</SheetTitle>
                    <p className="text-muted-foreground font-medium">
                        {displayParty} • Vereador
                    </p>
                </SheetHeader>

                {/* Vote Badge */}
                <div className="flex justify-center py-4 border-y border-border">
                    <LargeVoteBadge vote={councilor.vote} />
                </div>

                {/* Justification if present */}
                {councilor.justification && (
                    <div className="mt-4 p-4 rounded-xl bg-muted/50 border">
                        <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground mb-2">
                            <FileText className="w-4 h-4" />
                            Justificativa
                        </div>
                        <p className="text-sm leading-relaxed">
                            {councilor.justification}
                        </p>
                    </div>
                )}

                {/* Actions */}
                <div className="flex gap-3 mt-6">
                    <Button
                        onClick={handleShare}
                        className="flex-1 h-12 gap-2"
                        variant="default"
                    >
                        <Share2 className="w-4 h-4" />
                        Compartilhar voto
                    </Button>

                    {councilor.videoUrl && (
                        <Button
                            onClick={() => window.open(councilor.videoUrl, '_blank')}
                            variant="outline"
                            className="h-12 gap-2"
                        >
                            <ExternalLink className="w-4 h-4" />
                            Vídeo
                        </Button>
                    )}
                </div>

                {/* Footer note */}
                <p className="text-center text-xs text-muted-foreground mt-4">
                    Dados sujeitos à fonte oficial da Câmara
                </p>
            </SheetContent>
        </Sheet>
    );
}
