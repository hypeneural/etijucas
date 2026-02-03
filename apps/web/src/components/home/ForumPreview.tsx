// ======================================================
// ForumPreview - Boca no Trombone on Home with animations
// ======================================================

import React, { useMemo, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence, LayoutGroup } from 'framer-motion';
import {
  Heart,
  MessageCircle,
  Share2,
  MapPin,
  TrendingUp,
  Clock,
  Megaphone,
  ChevronRight,
  Sparkles,
  Users
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useAppStore } from '@/store/useAppStore';
import { useAuthStore } from '@/store/useAuthStore';
import { bairros } from '@/constants/bairros';
import { Topic, TopicCategory } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { TabId } from '@/components/layout/BottomTabBar';
import { formatTimeAgo } from '@/lib/formatTimeAgo';
import { useOfflineTopics, useLikeOfflineTopic } from '@/hooks/useOfflineTopics';

const categoryLabels: Record<TopicCategory, { label: string; color: string; bg: string }> = {
  reclamacao: { label: 'Reclamação', color: 'text-red-700', bg: 'bg-red-100' },
  sugestao: { label: 'Sugestão', color: 'text-blue-700', bg: 'bg-blue-100' },
  duvida: { label: 'Dúvida', color: 'text-purple-700', bg: 'bg-purple-100' },
  alerta: { label: 'Alerta', color: 'text-orange-700', bg: 'bg-orange-100' },
  elogio: { label: 'Elogio', color: 'text-green-700', bg: 'bg-green-100' },
  outros: { label: 'Outros', color: 'text-gray-700', bg: 'bg-gray-100' },
};

type SortOption = 'curtidos' | 'recentes' | 'perto';

interface ForumPreviewProps {
  onNavigate: (tab: TabId) => void;
}

export default function ForumPreview({ onNavigate }: ForumPreviewProps) {
  const navigate = useNavigate();
  const { selectedBairro } = useAppStore();
  const { isAuthenticated } = useAuthStore();
  const { toast } = useToast();
  const [sortBy, setSortBy] = useState<SortOption>('curtidos');
  const [isAnon, setIsAnon] = useState(false);

  // Use real API hooks
  const { data: topics = [], isLoading } = useOfflineTopics();
  const likeMutation = useLikeOfflineTopic();

  // Auth check helper
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

  const sortedTopics = useMemo(() => {
    let sorted = [...topics];
    switch (sortBy) {
      case 'curtidos':
        sorted = sorted.sort((a, b) => b.likesCount - a.likesCount);
        break;
      case 'recentes':
        sorted = sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'perto':
        sorted = sorted.filter(t => t.bairroId === selectedBairro?.id);
        break;
    }
    return sorted.slice(0, 3);
  }, [topics, sortBy, selectedBairro]);

  const totalTopics = topics.length;
  const totalComments = topics.reduce((acc, t) => acc + t.commentsCount, 0);

  const getBairroName = (bairroId: string, topic: Topic) => {
    // Use bairro from API if available
    if (topic.bairro?.nome) return topic.bairro.nome;
    return bairros.find(b => b.id === bairroId)?.nome || 'Tijucas';
  };

  const handleLike = (topic: Topic) => {
    if (!requireAuth('curtir')) return;
    if (navigator.vibrate) navigator.vibrate(10);
    likeMutation.mutate({ id: topic.id, currentlyLiked: topic.liked ?? false });
  };

  const handleShare = async (topic: Topic) => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: topic.titulo,
          text: topic.texto,
          url: window.location.href,
        });
      } catch (err) { }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: "Link copiado!" });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="px-4 py-4"
    >
      {/* Header with animated megaphone */}
      <motion.div
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-4 mb-4"
        whileHover={{ scale: 1.01 }}
        transition={{ type: 'spring', stiffness: 300 }}
      >
        {/* Animated background circles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <motion.div
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1]
            }}
            transition={{ duration: 3, repeat: Infinity }}
            className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/20"
          />
          <motion.div
            animate={{
              scale: [1.2, 1, 1.2],
              opacity: [0.1, 0.15, 0.1]
            }}
            transition={{ duration: 4, repeat: Infinity, delay: 0.5 }}
            className="absolute -bottom-10 -left-10 w-32 h-32 rounded-full bg-primary/15"
          />
        </div>

        <div className="relative flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Animated megaphone icon */}
            <motion.div
              animate={{
                rotate: [0, -10, 10, -5, 0],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                repeatDelay: 3
              }}
              className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"
            >
              <Megaphone className="w-6 h-6 text-primary" />
            </motion.div>
            <div>
              <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                Boca no Trombone
                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  <Sparkles className="w-4 h-4 text-yellow-500" />
                </motion.div>
              </h2>
              <p className="text-xs text-muted-foreground">A voz da comunidade</p>
            </div>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onNavigate('forum')}
            className="text-primary font-medium group"
          >
            Ver todos
            <ChevronRight className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="relative flex items-center gap-4 mt-3 pt-3 border-t border-primary/10"
        >
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="w-3.5 h-3.5" />
            <span><strong className="text-foreground">{totalTopics}</strong> tópicos</span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MessageCircle className="w-3.5 h-3.5" />
            <span><strong className="text-foreground">{totalComments}</strong> comentários</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Sort Filters with smooth animation */}
      <div className="flex items-center gap-2 mb-3 overflow-x-auto scrollbar-hide -mx-4 px-4">
        {[
          { id: 'curtidos' as SortOption, label: 'Mais curtidos', icon: TrendingUp },
          { id: 'recentes' as SortOption, label: 'Recentes', icon: Clock },
          { id: 'perto' as SortOption, label: 'Perto de mim', icon: MapPin },
        ].map((option) => {
          const Icon = option.icon;
          const isActive = sortBy === option.id;
          return (
            <motion.button
              key={option.id}
              whileTap={{ scale: 0.95 }}
              whileHover={{ y: -2 }}
              onClick={() => setSortBy(option.id)}
              className={`relative flex items-center gap-1.5 px-4 py-2 rounded-full whitespace-nowrap text-xs font-medium transition-all min-h-[36px] ${isActive
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'bg-muted text-muted-foreground hover:bg-muted-foreground/10'
                }`}
            >
              <Icon className="w-3.5 h-3.5" />
              {option.label}
              {isActive && (
                <motion.div
                  layoutId="activeSort"
                  className="absolute inset-0 bg-primary rounded-full -z-10"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Anonymous toggle + CTA */}
      <motion.div
        className="flex items-center justify-between mb-4 p-3 bg-muted/50 rounded-xl"
        whileHover={{ backgroundColor: 'hsl(var(--muted))' }}
      >
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <Switch checked={isAnon} onCheckedChange={setIsAnon} className="scale-90" />
          <span className="text-muted-foreground text-xs">Postar anônimo</span>
        </label>
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
          <Button
            size="sm"
            onClick={() => navigate('/forum?novo=true')}
            className="bg-primary text-primary-foreground text-xs h-9 px-4 shadow-sm"
          >
            <Megaphone className="w-3.5 h-3.5 mr-1.5" />
            Abrir tópico
          </Button>
        </motion.div>
      </motion.div>

      {/* Topics with staggered animation */}
      <LayoutGroup>
        <div className="space-y-3">
          <AnimatePresence mode="popLayout">
            {sortedTopics.map((topic, index) => (
              <motion.div
                key={topic.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: 'spring',
                  stiffness: 300,
                  damping: 25,
                  delay: index * 0.05
                }}
                whileHover={{ y: -2, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                className="bg-card rounded-2xl p-3 shadow-card border border-border/50 cursor-pointer"
                onClick={() => onNavigate('forum')}
              >
                <div className="flex items-start gap-3">
                  {/* Thumbnail with overlay */}
                  {topic.fotoUrl && (
                    <motion.div
                      className="relative w-16 h-16 rounded-xl overflow-hidden flex-shrink-0"
                      whileHover={{ scale: 1.05 }}
                    >
                      <img
                        src={topic.fotoUrl}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                    </motion.div>
                  )}

                  <div className="flex-1 min-w-0">
                    {/* Header */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge className={`${categoryLabels[topic.categoria].bg} ${categoryLabels[topic.categoria].color} text-[10px] px-1.5 py-0 border-0`}>
                        {categoryLabels[topic.categoria].label}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />
                        {getBairroName(topic.bairroId, topic)}
                      </span>
                      <span className="text-[10px] text-muted-foreground ml-auto">
                        {formatTimeAgo(topic.createdAt)}
                      </span>
                    </div>

                    {/* Content */}
                    <h3 className="font-medium text-sm text-foreground line-clamp-2 mb-2">
                      {topic.titulo}
                    </h3>

                    {/* Actions */}
                    <div className="flex items-center gap-4">
                      <motion.button
                        whileTap={{ scale: 0.85 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLike(topic);
                        }}
                        className="flex items-center gap-1 text-xs"
                      >
                        <motion.div
                          animate={topic.liked ? { scale: [1, 1.4, 1] } : {}}
                          transition={{ duration: 0.3 }}
                        >
                          <Heart
                            className={`w-4 h-4 ${topic.liked
                              ? 'fill-red-500 text-red-500'
                              : 'text-muted-foreground'
                              }`}
                          />
                        </motion.div>
                        <span className={topic.liked ? 'text-red-500 font-medium' : 'text-muted-foreground'}>
                          {topic.likesCount}
                        </span>
                      </motion.button>

                      <button className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageCircle className="w-4 h-4" />
                        <span>{topic.commentsCount}</span>
                      </button>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleShare(topic);
                        }}
                        className="flex items-center gap-1 text-xs text-muted-foreground ml-auto hover:text-foreground transition-colors"
                      >
                        <Share2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </LayoutGroup>

      {/* View more CTA */}
      <motion.button
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => onNavigate('forum')}
        className="w-full mt-4 py-3 text-sm font-medium text-primary bg-primary/5 hover:bg-primary/10 rounded-xl transition-colors flex items-center justify-center gap-2"
      >
        Ver mais tópicos
        <ChevronRight className="w-4 h-4" />
      </motion.button>
    </motion.div>
  );
}
