import { ExternalLink, AlertCircle } from 'lucide-react';
import { VoteSource } from '@/types/votes';
import { cn } from '@/lib/utils';

interface SourceFooterProps {
    source: VoteSource;
    className?: string;
}

export function SourceFooter({ source, className }: SourceFooterProps) {
    return (
        <div className={cn(
            'flex flex-col items-center gap-2 pt-6 pb-4 text-center',
            className
        )}>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <AlertCircle className="w-3.5 h-3.5" />
                <span>Dados sujeitos à fonte oficial</span>
            </div>
            <a
                href={source.url}
                target="_blank"
                rel="noopener noreferrer"
                className={cn(
                    'inline-flex items-center gap-1.5 px-3 py-1.5',
                    'text-sm font-medium text-primary',
                    'rounded-full border border-primary/20 bg-primary/5',
                    'hover:bg-primary/10 transition-colors'
                )}
            >
                <ExternalLink className="w-3.5 h-3.5" />
                {source.label}
            </a>
        </div>
    );
}
