// ======================================================
// ReportDiscussionTab - Discussion tab for reports
// ======================================================

import { useState } from 'react';
import { motion } from 'framer-motion';
import { MessageCircle, Eye, ThumbsUp, Send, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useAuthStore } from '@/store/useAuthStore';
import { useTenantNavigate } from '@/hooks';
import { useToast } from '@/hooks/use-toast';
import { formatTimeAgo } from '@/lib/formatTimeAgo';

interface Comment {
    id: string;
    text: string;
    authorName: string;
    isAnon: boolean;
    createdAt: string;
    type?: 'confirm' | 'support' | 'info' | 'normal';
}

interface ReportDiscussionTabProps {
    reportId: string;
    comments?: Comment[];
    onAddComment?: (text: string, type: 'confirm' | 'support' | 'info' | 'normal') => Promise<void>;
}

const commentTypeConfig = {
    confirm: { icon: Eye, label: 'Confirmou', color: 'text-blue-600 bg-blue-50' },
    support: { icon: ThumbsUp, label: 'Apoiou', color: 'text-green-600 bg-green-50' },
    info: { icon: MessageCircle, label: 'Info', color: 'text-purple-600 bg-purple-50' },
    normal: { icon: MessageCircle, label: '', color: '' },
};

export function ReportDiscussionTab({ reportId, comments = [], onAddComment }: ReportDiscussionTabProps) {
    const { isAuthenticated } = useAuthStore();
    const navigate = useTenantNavigate();
    const { toast } = useToast();
    const [newComment, setNewComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedType, setSelectedType] = useState<'confirm' | 'support' | 'info' | 'normal'>('normal');

    const handleSubmit = async () => {
        if (!isAuthenticated) {
            toast({
                title: 'Login necessário',
                description: 'Para comentar, você precisa estar logado.',
                action: (
                    <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                        Entrar
                    </Button>
                ),
            });
            return;
        }

        if (!newComment.trim()) return;

        setIsSubmitting(true);
        try {
            await onAddComment?.(newComment, selectedType);
            setNewComment('');
            setSelectedType('normal');
            toast({ title: 'Comentário adicionado!' });
        } catch (error) {
            toast({ title: 'Erro ao comentar', variant: 'destructive' });
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleQuickAction = async (type: 'confirm' | 'support' | 'info') => {
        if (!isAuthenticated) {
            toast({
                title: 'Login necessário',
                description: 'Para interagir, você precisa estar logado.',
            });
            return;
        }

        const messages = {
            confirm: 'Eu vi isso também!',
            support: 'Apoio essa observação!',
            info: '',
        };

        if (type === 'info') {
            setSelectedType('info');
            // Focus on textarea
        } else {
            setIsSubmitting(true);
            try {
                await onAddComment?.(messages[type], type);
                toast({ title: type === 'confirm' ? 'Confirmação registrada!' : 'Apoio registrado!' });
            } catch {
                toast({ title: 'Erro', variant: 'destructive' });
            } finally {
                setIsSubmitting(false);
            }
        }
    };

    return (
        <div className="space-y-4">
            {/* Quick Actions */}
            <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-4 px-4">
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction('confirm')}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-blue-50 text-blue-700 text-sm font-medium whitespace-nowrap hover:bg-blue-100 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    Eu vi também
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction('support')}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-green-50 text-green-700 text-sm font-medium whitespace-nowrap hover:bg-green-100 transition-colors"
                >
                    <ThumbsUp className="w-4 h-4" />
                    Apoiar
                </motion.button>
                <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleQuickAction('info')}
                    disabled={isSubmitting}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-full bg-purple-50 text-purple-700 text-sm font-medium whitespace-nowrap hover:bg-purple-100 transition-colors"
                >
                    <MessageCircle className="w-4 h-4" />
                    Tenho info
                </motion.button>
            </div>

            {/* Comments List */}
            <div className="space-y-3">
                {comments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">Seja o primeiro a comentar!</p>
                    </div>
                ) : (
                    comments.map((comment) => {
                        const typeConfig = commentTypeConfig[comment.type || 'normal'];
                        const TypeIcon = typeConfig.icon;
                        return (
                            <motion.div
                                key={comment.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="bg-muted/30 rounded-xl p-3"
                            >
                                <div className="flex items-start gap-2">
                                    {comment.type && comment.type !== 'normal' && (
                                        <div className={`p-1 rounded ${typeConfig.color}`}>
                                            <TypeIcon className="w-3 h-3" />
                                        </div>
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="text-xs font-medium">
                                                {comment.isAnon ? 'Observador Anônimo' : comment.authorName}
                                            </span>
                                            <span className="text-[10px] text-muted-foreground">
                                                {formatTimeAgo(comment.createdAt)}
                                            </span>
                                        </div>
                                        <p className="text-sm text-foreground">{comment.text}</p>
                                    </div>
                                </div>
                            </motion.div>
                        );
                    })
                )}
            </div>

            {/* Comment Input */}
            <div className="sticky bottom-0 bg-background pt-2 border-t">
                <div className="flex gap-2">
                    <Textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={selectedType === 'info' ? 'Compartilhe informações...' : 'Adicione um comentário...'}
                        className="min-h-[44px] max-h-24 resize-none rounded-xl"
                        rows={1}
                    />
                    <Button
                        onClick={handleSubmit}
                        disabled={!newComment.trim() || isSubmitting}
                        size="icon"
                        className="shrink-0 rounded-xl"
                    >
                        {isSubmitting ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <Send className="w-4 h-4" />
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

export default ReportDiscussionTab;
