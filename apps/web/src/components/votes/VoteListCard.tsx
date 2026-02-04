import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Calendar, ThumbsUp, ThumbsDown, ChevronRight, CheckCircle, XCircle, Clock } from 'lucide-react';
import { VoteHistoryItem, VoteStatus, VOTE_STATUS_CONFIG } from '@/types/votes';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

interface VoteListCardProps {
    vote: VoteHistoryItem;
    index?: number;
}

function VoteProgressBar({ counts }: { counts: VoteHistoryItem['counts'] }) {
    const total = counts.sim + counts.nao + counts.abstencao + counts.naoVotou;
    if (total === 0) return null;

    const simPercent = (counts.sim / total) * 100;
    const naoPercent = (counts.nao / total) * 100;
    const otherPercent = ((counts.abstencao + counts.naoVotou) / total) * 100;

    return (
        <div className="h-1.5 w-full rounded-full overflow-hidden bg-muted flex">
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${simPercent}%` }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="h-full bg-green-500"
            />
            <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${naoPercent}%` }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="h-full bg-red-500"
            />
            {otherPercent > 0 && (
                <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${otherPercent}%` }}
                    transition={{ duration: 0.6, delay: 0.4 }}
                    className="h-full bg-gray-300 dark:bg-gray-600"
                />
            )}
        </div>
    );
}

function StatusIcon({ status }: { status: VoteStatus }) {
    switch (status) {
        case 'APROVADO':
            return <CheckCircle className="w-3.5 h-3.5" />;
        case 'REJEITADO':
            return <XCircle className="w-3.5 h-3.5" />;
        case 'EM_ANDAMENTO':
            return <Clock className="w-3.5 h-3.5" />;
    }
}

export function VoteListCard({ vote, index = 0 }: VoteListCardProps) {
    const navigate = useNavigate();
    const statusConfig = VOTE_STATUS_CONFIG[vote.status];

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
        });
    };

    const handleClick = () => {
        navigate(`/votacoes/${vote.id}`);
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleClick}
            className={cn(
                'bg-card rounded-2xl p-4 border shadow-card',
                'cursor-pointer transition-all duration-200',
                'hover:shadow-md hover:border-border/80',
                'active:shadow-sm'
            )}
        >
            {/* Header: Date + Status */}
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{formatDate(vote.date)}</span>
                </div>
                <Badge
                    className={cn(
                        'gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border',
                        statusConfig.bgColor,
                        statusConfig.textColor,
                        statusConfig.borderColor
                    )}
                >
                    <StatusIcon status={vote.status} />
                    {statusConfig.label}
                </Badge>
            </div>

            {/* Title */}
            <h3 className="text-lg font-bold text-foreground leading-tight mb-1.5 line-clamp-2">
                {vote.title}
            </h3>

            {/* Summary */}
            <p className="text-sm text-muted-foreground leading-relaxed line-clamp-2 mb-4">
                {vote.summary}
            </p>

            {/* Vote Counts */}
            <div className="flex items-center gap-4 mb-3">
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30">
                        <ThumbsUp className="w-3 h-3 text-green-600 dark:text-green-400" />
                    </div>
                    <span className="text-sm font-bold text-green-600 dark:text-green-400">
                        {vote.counts.sim}
                    </span>
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-red-100 dark:bg-red-900/30">
                        <ThumbsDown className="w-3 h-3 text-red-600 dark:text-red-400" />
                    </div>
                    <span className="text-sm font-bold text-red-600 dark:text-red-400">
                        {vote.counts.nao}
                    </span>
                </div>
                {(vote.counts.abstencao > 0 || vote.counts.naoVotou > 0) && (
                    <span className="text-xs text-muted-foreground">
                        +{vote.counts.abstencao + vote.counts.naoVotou} outros
                    </span>
                )}

                {/* Spacer */}
                <div className="flex-1" />

                {/* Score Display */}
                <div className="flex items-center gap-1 text-sm font-bold text-foreground">
                    <span className="text-green-600">{vote.counts.sim}</span>
                    <span className="text-muted-foreground">×</span>
                    <span className="text-red-600">{vote.counts.nao}</span>
                </div>
            </div>

            {/* Progress Bar */}
            <VoteProgressBar counts={vote.counts} />

            {/* Footer: CTA */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/50">
                <div className="flex gap-1.5 flex-wrap">
                    {vote.tags.slice(0, 2).map((tag) => (
                        <span
                            key={tag}
                            className="px-2 py-0.5 rounded-md bg-muted text-[10px] font-medium text-muted-foreground"
                        >
                            {tag}
                        </span>
                    ))}
                </div>
                <Button
                    variant="ghost"
                    size="sm"
                    className="text-primary font-semibold gap-1 -mr-2"
                    onClick={(e) => {
                        e.stopPropagation();
                        handleClick();
                    }}
                >
                    Ver votos
                    <ChevronRight className="w-4 h-4" />
                </Button>
            </div>
        </motion.div>
    );
}
