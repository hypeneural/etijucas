// ======================================================
// TopicCardWithReactions - Wrapper with reaction hook integration
// ======================================================

import { useState } from 'react';
import { TopicCard } from '@/components/forum/TopicCard';
import { useTopicReaction } from '@/hooks/useTopicReaction';
import { useAuthStore } from '@/store/useAuthStore';
import { Topic } from '@/types';
import { toast } from 'sonner';

interface TopicCardWithReactionsProps {
    topic: Topic;
    onPress?: () => void;
    onLike?: () => void;
    onComment?: () => void;
    onShare?: () => void;
    onMore?: () => void;
    onRequireAuth?: (action: string) => boolean;
}

/**
 * Wrapper component that connects TopicCard to the useTopicReaction hook.
 * This enables real, persistent reactions (confirm/support) for each topic.
 */
export function TopicCardWithReactions({
    topic,
    onPress,
    onLike,
    onComment,
    onShare,
    onMore,
    onRequireAuth,
}: TopicCardWithReactionsProps) {
    const { isAuthenticated } = useAuthStore();
    const { confirm, support, isConfirmLoading, isSupportLoading } = useTopicReaction(topic.id);

    const handleConfirm = () => {
        if (!isAuthenticated) {
            if (onRequireAuth) {
                onRequireAuth('confirmar a observação');
            } else {
                toast.info('Faça login para confirmar que vi também');
            }
            return;
        }
        confirm();
    };

    const handleSupport = () => {
        if (!isAuthenticated) {
            if (onRequireAuth) {
                onRequireAuth('apoiar esta observação');
            } else {
                toast.info('Faça login para apoiar');
            }
            return;
        }
        support();
    };

    return (
        <TopicCard
            topic={topic}
            onPress={onPress}
            onLike={onLike}
            onComment={onComment}
            onShare={onShare}
            onMore={onMore}
            onConfirm={handleConfirm}
            onSupport={handleSupport}
        />
    );
}

export default TopicCardWithReactions;
