import { motion } from 'framer-motion';
import { Check, X, Pause, Minus, User, ChevronRight } from 'lucide-react';
import { Councilor, VoteType, VOTE_CONFIG } from '@/types/votes';
import { cn } from '@/lib/utils';

interface CouncilorVoteCardProps {
    councilor: Councilor;
    searchQuery?: string;
    onClick?: () => void;
    index?: number;
}

function VoteBadgeWithLabel({ vote }: { vote: VoteType }) {
    const config = VOTE_CONFIG[vote];

    const IconComponent = {
        SIM: Check,
        NAO: X,
        ABSTENCAO: Pause,
        NAO_VOTOU: Minus,
    }[vote];

    return (
        <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 400, damping: 25 }}
            className="flex flex-col items-center gap-1"
        >
            {/* Large circular icon */}
            <div
                className={cn(
                    'flex items-center justify-center w-12 h-12 rounded-full',
                    'shadow-lg transition-transform duration-200',
                    config.bgColor
                )}
            >
                <IconComponent className="w-6 h-6 text-white" strokeWidth={2.5} />
            </div>
            {/* Colored vote label */}
            <span
                className={cn(
                    'text-xs font-bold uppercase tracking-wide',
                    config.color
                )}
            >
                {config.label}
            </span>
        </motion.div>
    );
}

function HighlightedText({ text, query }: { text: string; query?: string }) {
    if (!query || query.trim() === '') {
        return <span>{text}</span>;
    }

    const regex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    const parts = text.split(regex);

    return (
        <span>
            {parts.map((part, i) =>
                regex.test(part) ? (
                    <mark key={i} className="bg-primary/20 text-primary rounded px-0.5">
                        {part}
                    </mark>
                ) : (
                    <span key={i}>{part}</span>
                )
            )}
        </span>
    );
}

export function CouncilorVoteCard({ councilor, searchQuery, onClick, index = 0 }: CouncilorVoteCardProps) {
    const config = VOTE_CONFIG[councilor.vote];
    const isAbsent = councilor.vote === 'NAO_VOTOU';
    const displayParty = councilor.party === '???' || !councilor.party ? '—' : councilor.party;

    return (
        <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ delay: index * 0.04, type: 'spring', stiffness: 300, damping: 25 }}
            whileTap={{ scale: 0.97 }}
            whileHover={{ y: -2 }}
            onClick={onClick}
            className={cn(
                'group relative w-full flex items-center gap-4 p-4 pl-5',
                'bg-card rounded-2xl border transition-all duration-200',
                'text-left shadow-card',
                'hover:shadow-lg hover:border-primary/20',
                'overflow-hidden',
                isAbsent && 'opacity-60'
            )}
        >
            {/* Accent Line - thicker and more vibrant */}
            <motion.div
                initial={{ height: 0 }}
                animate={{ height: '100%' }}
                transition={{ delay: index * 0.04 + 0.1, duration: 0.3 }}
                className={cn(
                    'absolute left-0 top-0 bottom-0 w-1.5 rounded-l-2xl',
                    isAbsent ? 'bg-gray-300 dark:bg-gray-600' : config.accentColor
                )}
            />

            {/* Avatar with ring */}
            <div className="relative shrink-0">
                <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.04 + 0.05, type: 'spring', stiffness: 400 }}
                    className={cn(
                        'w-14 h-14 rounded-full overflow-hidden',
                        'ring-2 ring-offset-2 ring-offset-card',
                        isAbsent ? 'ring-gray-300 dark:ring-gray-600' : config.borderColor.replace('border-', 'ring-')
                    )}
                >
                    {councilor.photoUrl ? (
                        <img
                            src={councilor.photoUrl}
                            alt={councilor.name}
                            className={cn(
                                'w-full h-full object-cover',
                                isAbsent && 'grayscale opacity-60'
                            )}
                            onError={(e) => {
                                e.currentTarget.style.display = 'none';
                                e.currentTarget.nextElementSibling?.classList.remove('hidden');
                            }}
                        />
                    ) : null}
                    <div
                        className={cn(
                            'absolute inset-0 bg-muted flex items-center justify-center',
                            councilor.photoUrl ? 'hidden' : '',
                            isAbsent && 'bg-gray-100 dark:bg-gray-800'
                        )}
                    >
                        <User
                            className={cn(
                                'w-7 h-7',
                                isAbsent ? 'text-gray-400' : 'text-muted-foreground'
                            )}
                        />
                    </div>
                </motion.div>

                {/* Micro vote indicator on avatar */}
                <div
                    className={cn(
                        'absolute -bottom-0.5 -right-0.5 w-5 h-5 rounded-full',
                        'flex items-center justify-center ring-2 ring-card',
                        config.bgColor
                    )}
                >
                    {councilor.vote === 'SIM' && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                    {councilor.vote === 'NAO' && <X className="w-3 h-3 text-white" strokeWidth={3} />}
                    {councilor.vote === 'ABSTENCAO' && <Pause className="w-3 h-3 text-white" strokeWidth={3} />}
                    {councilor.vote === 'NAO_VOTOU' && <Minus className="w-3 h-3 text-white" strokeWidth={3} />}
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                <h3
                    className={cn(
                        'text-base font-bold leading-tight truncate',
                        isAbsent ? 'text-muted-foreground' : 'text-foreground'
                    )}
                >
                    <HighlightedText text={councilor.name} query={searchQuery} />
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5 flex items-center gap-2">
                    <span className="font-medium">{displayParty}</span>
                    <span className="text-border">•</span>
                    <span className={cn('font-semibold', config.color)}>{config.label}</span>
                </p>
            </div>

            {/* Vote Badge with Label */}
            <VoteBadgeWithLabel vote={councilor.vote} />

            {/* Chevron hint */}
            <ChevronRight className="w-5 h-5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
        </motion.button>
    );
}
