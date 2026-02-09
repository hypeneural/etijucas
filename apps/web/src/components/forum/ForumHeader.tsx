// ======================================================
// ForumHeader - Sticky header with title and search
// ======================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useCityName } from '@/hooks/useCityName';
import { Input } from '@/components/ui/input';

interface ForumHeaderProps {
    onSearch?: (query: string) => void;
    onSearchFocus?: () => void;
}

export function ForumHeader({ onSearch, onSearchFocus }: ForumHeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isFocused, setIsFocused] = useState(false);
    const { name } = useCityName();

    const handleSearch = (value: string) => {
        setSearchQuery(value);
        onSearch?.(value);
    };

    const handleClear = () => {
        setSearchQuery('');
        onSearch?.('');
    };

    const handleFocus = () => {
        setIsFocused(true);
        onSearchFocus?.();
    };

    return (
        <div className="sticky top-0 z-20 bg-background/95 backdrop-blur-md safe-top">
            {/* Title section */}
            <motion.div
                className="px-4 pt-4 pb-3"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <h1 className="text-2xl font-bold text-foreground tracking-tight">
                    Papo dos Observadores
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Comunidade de {name}
                </p>
            </motion.div>

            {/* Search bar */}
            <div className="px-4 pb-3">
                <motion.div
                    className="relative"
                    animate={{
                        scale: isFocused ? 1.01 : 1,
                    }}
                    transition={{ duration: 0.2 }}
                >
                    <Search
                        className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 transition-colors ${isFocused ? 'text-primary' : 'text-muted-foreground'
                            }`}
                    />
                    <Input
                        value={searchQuery}
                        onChange={(e) => handleSearch(e.target.value)}
                        onFocus={handleFocus}
                        onBlur={() => setIsFocused(false)}
                        placeholder="Buscar assunto, rua, bairro…"
                        className={`pl-11 pr-10 h-12 rounded-2xl border-2 text-base transition-all ${isFocused
                            ? 'border-primary bg-background shadow-lg'
                            : 'border-transparent bg-muted/50'
                            }`}
                    />
                    {searchQuery && (
                        <motion.button
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            onClick={handleClear}
                            className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full bg-muted hover:bg-muted-foreground/20 transition-colors"
                            aria-label="Limpar busca"
                        >
                            <X className="w-4 h-4 text-muted-foreground" />
                        </motion.button>
                    )}
                </motion.div>
            </div>
        </div>
    );
}

export default ForumHeader;
