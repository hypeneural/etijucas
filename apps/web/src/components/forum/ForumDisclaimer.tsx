// ======================================================
// ForumDisclaimer - Community disclaimer banner
// ======================================================

import { Info } from 'lucide-react';

export function ForumDisclaimer() {
    return (
        <div className="px-4 py-2 bg-blue-50/50 dark:bg-blue-900/10 border-b border-blue-100/50 dark:border-blue-800/20">
            <div className="flex gap-2 text-[10px] leading-tight text-blue-700 dark:text-blue-300 items-start">
                <Info className="w-3 h-3 flex-shrink-0 mt-0.5" />
                <p>
                    Comunidade independente de Observadores.
                    <span className="opacity-70 ml-1">
                        Não é um canal oficial da Prefeitura ou órgãos públicos.
                    </span>
                </p>
            </div>
        </div>
    );
}

export default ForumDisclaimer;
