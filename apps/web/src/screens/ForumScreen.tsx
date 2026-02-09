// ======================================================
// ForumScreen - Boca no Trombone Feed
// Complete redesign with modern timeline UI
// ======================================================

import React, { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VirtualList } from '@/components/ui/VirtualList';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineTopics, useLikeOfflineTopic, useCreateOfflineTopic } from '@/hooks/useOfflineTopics';
import { useToast } from '@/hooks/use-toast';
import { Topic, TopicCategory } from '@/types';
import { calculateHotScore } from '@/lib/formatTimeAgo';
import {
  ForumHeader,
  ForumSortSegmented,
  ForumFiltersChips,
  TopicCard,
  TopicSkeletonList,
  ForumEmptyState,
  TopicComposerSheet,
  TopicActionMenu,
  type SortOption,
  type ForumFilters,
  type NewTopicData,
} from '@/components/forum';

interface ForumScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

export default function ForumScreen({ scrollRef }: ForumScreenProps) {
  // Get selectedBairro from store (still needed for filtering)
  const { selectedBairro } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { isOnline } = useNetworkStatus();
  const { toast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  // Use new offline-first hooks
  const { data: topics = [], isLoading: isQueryLoading, refetch } = useOfflineTopics();
  const likeMutation = useLikeOfflineTopic();
  const createMutation = useCreateOfflineTopic();

  // State
  const [sortBy, setSortBy] = useState<SortOption>('curtidos');
  const [searchQuery, setSearchQuery] = useState('');
  const [filters, setFilters] = useState<ForumFilters>({});
  const [isComposerOpen, setIsComposerOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check if should open composer from URL (e.g., ?novo=true)
  useEffect(() => {
    if (searchParams.get('novo') === 'true') {
      // Clear the query param first
      searchParams.delete('novo');
      setSearchParams(searchParams, { replace: true });

      // Only open if authenticated
      if (isAuthenticated) {
        setIsComposerOpen(true);
      } else {
        // Show login toast
        toast({
          title: 'Login necessário',
          description: 'Para criar um tópico, você precisa estar logado.',
          action: (
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.location.href = '/login'}
            >
              Entrar
            </Button>
          ),
        });
      }
    }
  }, [searchParams, setSearchParams, isAuthenticated, toast]);

  // Infinite scroll state
  const [displayCount, setDisplayCount] = useState(10);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);


  const containerRef = useRef<HTMLDivElement>(null);

  // Infinite scroll observer
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);
          // Simulate loading delay for smooth UX
          setTimeout(() => {
            setDisplayCount((prev) => prev + 10);
            setIsLoadingMore(false);
          }, 300);
        }
      },
      { rootMargin: '200px' }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [isLoadingMore]);

  // Reset display count when filters change
  useEffect(() => {
    setDisplayCount(10);
  }, [searchQuery, filters, sortBy]);

  // Filter and sort topics
  const filteredTopics = useMemo(() => {
    let result = [...topics];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (t) =>
          t.titulo.toLowerCase().includes(query) ||
          t.texto.toLowerCase().includes(query)
      );
    }

    // Category filter
    if (filters.categoria) {
      result = result.filter((t) => t.categoria === filters.categoria);
    }

    // Bairro filter
    if (filters.bairroId) {
      result = result.filter((t) => t.bairroId === filters.bairroId);
    }

    // My bairro filter
    if (filters.meuBairro && selectedBairro) {
      result = result.filter((t) => t.bairroId === selectedBairro.id);
    }

    // With photo filter
    if (filters.comFoto) {
      result = result.filter((t) => t.fotoUrl);
    }

    // Period filter
    if (filters.periodo) {
      const now = new Date();
      const cutoff = new Date();

      switch (filters.periodo) {
        case 'hoje':
          cutoff.setHours(0, 0, 0, 0);
          break;
        case '7dias':
          cutoff.setDate(cutoff.getDate() - 7);
          break;
        case '30dias':
          cutoff.setDate(cutoff.getDate() - 30);
          break;
      }

      if (filters.periodo !== 'todos') {
        result = result.filter((t) => new Date(t.createdAt) >= cutoff);
      }
    }

    // Sort
    switch (sortBy) {
      case 'curtidos':
        // Hot score: likes + comments + recency
        result.sort((a, b) => {
          const scoreA = calculateHotScore(a.likesCount, a.commentsCount, a.createdAt);
          const scoreB = calculateHotScore(b.likesCount, b.commentsCount, b.createdAt);
          return scoreB - scoreA;
        });
        break;
      case 'recentes':
        result.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      case 'perto':
        // Filter to user's bairro first, then by recency
        result = result
          .filter((t) => t.bairroId === selectedBairro?.id)
          .sort(
            (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          );
        break;
    }

    return result;
  }, [topics, searchQuery, filters, sortBy, selectedBairro]);

  // Helper to prompt login for auth-required actions
  const requireAuth = useCallback((action: string): boolean => {
    if (!isAuthenticated) {
      toast({
        title: 'Login necessário',
        description: `Para ${action}, você precisa estar logado.`,
        action: (
          <Button
            variant="outline"
            size="sm"
            onClick={() => window.location.href = '/login'}
          >
            Entrar
          </Button>
        ),
      });
      return false;
    }
    return true;
  }, [isAuthenticated, toast]);

  // Handlers
  const handleLike = useCallback((topicId: string) => {
    if (!requireAuth('curtir')) return;

    const topic = topics.find(t => t.id === topicId);
    if (topic) {
      likeMutation.mutate({ id: topicId, currentlyLiked: topic.liked ?? false });
    }
  }, [topics, likeMutation, requireAuth]);

  const handleShare = useCallback(async (topic: Topic) => {
    const shareData = {
      title: topic.titulo,
      text: topic.texto,
      url: `${window.location.origin}/topico/${topic.id}`,
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(shareData.url);
      toast({
        title: 'Link copiado!',
        description: 'O link foi copiado para a área de transferência.',
      });
    }
  }, [toast]);

  const handleOpenDetail = useCallback((topicId: string) => {
    // Navigate to topic detail
    window.location.href = `/topico/${topicId}`;
  }, []);

  const handleOpenCommentDirect = useCallback((topicId: string) => {
    if (!requireAuth('comentar')) return;
    // Navigate to topic with comment focus
    window.location.href = `/topico/${topicId}?comment=true`;
  }, [requireAuth]);

  const handleSubmitTopic = useCallback(async (data: NewTopicData) => {
    try {
      await createMutation.mutateAsync({
        categoria: data.categoria,
        titulo: data.titulo,
        texto: data.texto,
        isAnon: data.isAnon,
        bairroId: data.bairroId,
        fotoUrl: data.fotoUrl,
      });

      toast({
        title: 'Tópico publicado! 🎉',
        description: isOnline
          ? 'Seu tópico foi publicado na comunidade.'
          : 'Seu tópico será publicado quando voltar online.',
      });
    } catch (error) {
      toast({
        title: 'Erro ao publicar',
        description: 'Tente novamente.',
        variant: 'destructive',
      });
    }
  }, [createMutation, toast, isOnline]);

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await refetch();
    setIsRefreshing(false);
    toast({
      title: 'Atualizado!',
      description: 'O feed foi atualizado.',
    });
  }, [refetch, toast]);

  const handleClearFilters = useCallback(() => {
    setFilters({});
    setSearchQuery('');
  }, []);

  // Determine empty state type
  const getEmptyStateType = () => {
    if (!isOnline && topics.length === 0) return 'offline';
    if (searchQuery || Object.keys(filters).length > 0) return 'no-results';
    return 'empty';
  };

  const hasActiveFilters = searchQuery || Object.keys(filters).length > 0;

  return (
    <div
      ref={(el) => {
        scrollRef?.(el);
        (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = el;
      }}
      className="h-full overflow-y-auto bg-background"
    >
      {/* Header with search */}
      <ForumHeader
        onSearch={setSearchQuery}
        onSearchFocus={() => { }}
      />

      {/* Sort control */}
      <ForumSortSegmented value={sortBy} onChange={setSortBy} />

      {/* Filters */}
      <ForumFiltersChips
        filters={filters}
        onChange={setFilters}
        userBairroId={selectedBairro?.id}
      />

      {/* Offline indicator */}
      {!isOnline && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mx-4 mb-3 px-4 py-2 bg-orange-100 dark:bg-orange-900/30 rounded-xl flex items-center gap-2 text-sm text-orange-700 dark:text-orange-400"
        >
          <span>📡</span>
          <span>Você está offline. Mostrando tópicos salvos.</span>
        </motion.div>
      )}

      {/* Refresh button when scrolled */}
      {isRefreshing && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="flex justify-center py-2"
        >
          <RefreshCw className="w-5 h-5 animate-spin text-primary" />
        </motion.div>
      )}

      {/* Topics list - Virtualized for performance */}
      <div className="flex-1 px-4 pb-32">
        {isLoading || isQueryLoading ? (
          <TopicSkeletonList count={3} />
        ) : filteredTopics.length > 0 ? (
          <VirtualList
            items={filteredTopics}
            estimatedItemSize={180}
            overscan={3}
            gap={12}
            className="h-full"
            getItemKey={(topic) => topic.id}
            renderItem={(topic) => (
              <TopicCard
                topic={topic}
                onPress={() => handleOpenDetail(topic.id)}
                onLike={() => handleLike(topic.id)}
                onComment={() => handleOpenCommentDirect(topic.id)}
                onShare={() => handleShare(topic)}
              />
            )}
          />
        ) : (
          <ForumEmptyState
            type={getEmptyStateType()}
            onAction={hasActiveFilters ? handleClearFilters : () => {
              if (requireAuth('criar um tópico')) {
                setIsComposerOpen(true);
              }
            }}
            onClearFilters={handleClearFilters}
          />
        )}
      </div>

      {/* FAB */}
      <motion.div
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 400, damping: 15, delay: 0.3 }}
        className="fixed bottom-24 right-4 z-30"
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            onClick={() => {
              if (requireAuth('criar um tópico')) {
                setIsComposerOpen(true);
              }
            }}
            size="lg"
            className="w-14 h-14 rounded-full shadow-lg bg-primary text-primary-foreground hover:bg-primary/90"
            aria-label="Criar novo tópico"
          >
            <Plus className="w-6 h-6" />
          </Button>
        </motion.div>
      </motion.div>

      {/* Composer sheet */}
      <TopicComposerSheet
        open={isComposerOpen}
        onOpenChange={setIsComposerOpen}
        onSubmit={handleSubmitTopic}
        defaultBairroId={selectedBairro?.id}
      />
    </div>
  );
}
