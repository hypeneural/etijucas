import { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    Share2,
    Loader2,
    Phone,
    Mail,
    Globe,
    Facebook,
    Instagram,
    MessageCircle,
    Youtube,
    CheckCircle2,
    XCircle,
    MinusCircle,
    Clock,
    Calendar,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { useToast } from '@/hooks/use-toast';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAppStore } from '@/store/useAppStore';
import { useQuery } from '@tanstack/react-query';
import { QUERY_KEYS } from '@/api/config';

// Services
import { vereadoresService } from '@/services/votes.service';

// Types
import type { VotacaoList } from '@/types/votes';

export default function VereadorDetailPage() {
    const { slug } = useParams<{ slug: string }>();
    const navigate = useNavigate();
    const { toast } = useToast();
    const { activeTab, setActiveTab } = useAppStore();

    // Fetch vereador details
    const { data: vereador, isLoading, error } = useQuery({
        queryKey: QUERY_KEYS.votes.vereador(slug || ''),
        queryFn: () => vereadoresService.getBySlug(slug!),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });

    // Fetch vereador's votações
    const { data: votacoes } = useQuery({
        queryKey: QUERY_KEYS.votes.vereadorVotacoes(slug || ''),
        queryFn: () => vereadoresService.getVotacoes(slug!),
        enabled: !!slug,
        staleTime: 5 * 60 * 1000,
    });

    const handleShare = async () => {
        if (!vereador) return;

        const shareData = {
            title: vereador.nome,
            text: `${vereador.nome} - ${vereador.mandatoAtual?.partido?.sigla || 'Vereador'}`,
            url: window.location.href,
        };

        if (navigator.share) {
            try {
                await navigator.share(shareData);
            } catch { }
        } else if (navigator.clipboard) {
            await navigator.clipboard.writeText(shareData.url);
            toast({ title: 'Link copiado!', description: 'Cole onde quiser compartilhar.' });
        }
    };

    const handleTabChange = (tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    };

    const initials = useMemo(() => {
        if (!vereador) return '';
        return vereador.nome
            .split(' ')
            .map((n) => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    }, [vereador]);

    // Loading state
    if (isLoading) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
                <div className="relative w-full max-w-[420px] h-full bg-background flex items-center justify-center">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Error state
    if (error || !vereador) {
        return (
            <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
                <div className="relative w-full max-w-[420px] h-full bg-background flex flex-col items-center justify-center gap-4 p-6">
                    <p className="text-muted-foreground text-center">
                        Não foi possível carregar os dados do vereador
                    </p>
                    <Button variant="outline" onClick={() => navigate(-1)}>
                        Voltar
                    </Button>
                </div>
            </div>
        );
    }

    const partido = vereador.mandatoAtual?.partido;
    const stats = vereador.estatisticas;

    return (
        <div className="fixed inset-0 flex items-center justify-center bg-muted/50">
            <div className="relative w-full max-w-[420px] h-full bg-background overflow-hidden shadow-elevated">
                <div className="h-full overflow-y-auto pb-24">
                    {/* Header */}
                    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b">
                        <div className="flex items-center justify-between px-4 py-3 safe-top">
                            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
                                <ArrowLeft className="h-5 w-5" />
                            </Button>
                            <h1 className="text-lg font-bold">Perfil do Vereador</h1>
                            <Button variant="ghost" size="icon" onClick={handleShare}>
                                <Share2 className="h-5 w-5" />
                            </Button>
                        </div>
                    </header>

                    <main className="px-4 py-5 space-y-6">
                        {/* Profile Hero */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                        >
                            <Card className="rounded-2xl overflow-hidden">
                                {/* Party color bar */}
                                <div
                                    className="h-2"
                                    style={{ backgroundColor: partido?.corHex || '#6B7280' }}
                                />

                                <CardContent className="p-6 flex flex-col items-center text-center gap-4">
                                    <Avatar className="w-24 h-24 border-4 border-muted shadow-lg">
                                        <AvatarImage src={vereador.fotoUrl || ''} alt={vereador.nome} />
                                        <AvatarFallback className="text-2xl font-bold bg-primary/10 text-primary">
                                            {initials}
                                        </AvatarFallback>
                                    </Avatar>

                                    <div className="space-y-2">
                                        <h2 className="text-xl font-bold text-foreground">
                                            {vereador.nome}
                                        </h2>

                                        <div className="flex items-center justify-center gap-2">
                                            {partido && (
                                                <Badge
                                                    className="px-3 py-1"
                                                    style={{
                                                        backgroundColor: `${partido.corHex}20`,
                                                        borderColor: partido.corHex,
                                                        color: partido.corHex,
                                                    }}
                                                >
                                                    {partido.sigla}
                                                </Badge>
                                            )}

                                            {vereador.mandatoAtual?.cargo && (
                                                <Badge variant="secondary">
                                                    {vereador.mandatoAtual.cargo}
                                                </Badge>
                                            )}
                                        </div>

                                        {vereador.mandatoAtual?.legislatura && (
                                            <p className="text-sm text-muted-foreground">
                                                {vereador.mandatoAtual.legislatura.nomeCompleto}
                                            </p>
                                        )}

                                        {!vereador.mandatoAtual?.emExercicio && (
                                            <Badge variant="outline" className="text-amber-600 border-amber-300">
                                                Licenciado do mandato
                                            </Badge>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.section>

                        {/* Bio */}
                        {vereador.bio && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.05 }}
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Sobre</CardTitle>
                                    </CardHeader>
                                    <CardContent>
                                        <p className="text-sm text-muted-foreground leading-relaxed">
                                            {vereador.bio}
                                        </p>
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}

                        {/* Contact & Social */}
                        <motion.section
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                        >
                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">Contato</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    {vereador.telefone && (
                                        <a
                                            href={`tel:${vereador.telefone}`}
                                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Phone className="h-4 w-4 text-primary" />
                                            {vereador.telefone}
                                        </a>
                                    )}

                                    {vereador.email && (
                                        <a
                                            href={`mailto:${vereador.email}`}
                                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Mail className="h-4 w-4 text-primary" />
                                            {vereador.email}
                                        </a>
                                    )}

                                    {vereador.siteOficialUrl && (
                                        <a
                                            href={vereador.siteOficialUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Globe className="h-4 w-4 text-primary" />
                                            Site Oficial
                                        </a>
                                    )}

                                    {/* Social Media */}
                                    {vereador.redesSociais && Object.keys(vereador.redesSociais).length > 0 && (
                                        <div className="flex items-center gap-3 pt-2">
                                            {vereador.redesSociais.facebook && (
                                                <a
                                                    href={`https://facebook.com/${vereador.redesSociais.facebook}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:scale-110 transition-transform"
                                                >
                                                    <Facebook className="h-4 w-4" />
                                                </a>
                                            )}
                                            {vereador.redesSociais.instagram && (
                                                <a
                                                    href={`https://instagram.com/${vereador.redesSociais.instagram}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-pink-100 dark:bg-pink-900/30 text-pink-600 dark:text-pink-400 hover:scale-110 transition-transform"
                                                >
                                                    <Instagram className="h-4 w-4" />
                                                </a>
                                            )}
                                            {vereador.redesSociais.whatsapp && (
                                                <a
                                                    href={`https://wa.me/${vereador.redesSociais.whatsapp.replace(/\D/g, '')}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:scale-110 transition-transform"
                                                >
                                                    <MessageCircle className="h-4 w-4" />
                                                </a>
                                            )}
                                            {vereador.redesSociais.youtube && (
                                                <a
                                                    href={`https://youtube.com/${vereador.redesSociais.youtube}`}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-2 rounded-full bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 hover:scale-110 transition-transform"
                                                >
                                                    <Youtube className="h-4 w-4" />
                                                </a>
                                            )}
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </motion.section>

                        {/* Voting Statistics */}
                        {stats && stats.totalVotos > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.15 }}
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base">Estatísticas de Votação</CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-4">
                                        {/* Attendance */}
                                        <div className="space-y-2">
                                            <div className="flex items-center justify-between text-sm">
                                                <span className="text-muted-foreground">Presença</span>
                                                <span className="font-semibold">{stats.presencaPercent}%</span>
                                            </div>
                                            <Progress value={stats.presencaPercent} className="h-2" />
                                        </div>

                                        {/* Vote breakdown */}
                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                            <StatCard
                                                icon={<CheckCircle2 className="h-4 w-4 text-green-500" />}
                                                label="Votou Sim"
                                                value={stats.votouSim}
                                                color="green"
                                            />
                                            <StatCard
                                                icon={<XCircle className="h-4 w-4 text-red-500" />}
                                                label="Votou Não"
                                                value={stats.votouNao}
                                                color="red"
                                            />
                                            <StatCard
                                                icon={<MinusCircle className="h-4 w-4 text-amber-500" />}
                                                label="Abstenções"
                                                value={stats.abstencoes}
                                                color="amber"
                                            />
                                            <StatCard
                                                icon={<Clock className="h-4 w-4 text-gray-500" />}
                                                label="Ausências"
                                                value={stats.ausencias}
                                                color="gray"
                                            />
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}

                        {/* Recent Votações */}
                        {votacoes && votacoes.length > 0 && (
                            <motion.section
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.2 }}
                            >
                                <Card>
                                    <CardHeader className="pb-2">
                                        <CardTitle className="text-base flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-primary" />
                                            Últimas Votações
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="space-y-3">
                                        <AnimatePresence>
                                            {votacoes.slice(0, 5).map((votacao: VotacaoList) => (
                                                <VotacaoMiniCard
                                                    key={votacao.id}
                                                    votacao={votacao}
                                                    onClick={() => navigate(`/votacoes/${votacao.id}`)}
                                                />
                                            ))}
                                        </AnimatePresence>

                                        {votacoes.length > 5 && (
                                            <Button
                                                variant="ghost"
                                                className="w-full text-primary"
                                                onClick={() => navigate(`/votacoes?vereador=${slug}`)}
                                            >
                                                Ver todas ({votacoes.length})
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            </motion.section>
                        )}
                    </main>
                </div>

                {/* Bottom Tab Bar */}
                <BottomTabBar activeTab={activeTab} onTabChange={handleTabChange} />
            </div>
        </div>
    );
}

// ==========================================
// Helper Components
// ==========================================

interface StatCardProps {
    icon: React.ReactNode;
    label: string;
    value: number;
    color: 'green' | 'red' | 'amber' | 'gray';
}

function StatCard({ icon, label, value, color }: StatCardProps) {
    const bgColors = {
        green: 'bg-green-50 dark:bg-green-900/20',
        red: 'bg-red-50 dark:bg-red-900/20',
        amber: 'bg-amber-50 dark:bg-amber-900/20',
        gray: 'bg-gray-50 dark:bg-gray-900/20',
    };

    return (
        <div className={cn('rounded-lg p-3', bgColors[color])}>
            <div className="flex items-center gap-2 mb-1">
                {icon}
                <span className="text-xs text-muted-foreground">{label}</span>
            </div>
            <span className="text-xl font-bold">{value}</span>
        </div>
    );
}

interface VotacaoMiniCardProps {
    votacao: VotacaoList;
    onClick: () => void;
}

function VotacaoMiniCard({ votacao, onClick }: VotacaoMiniCardProps) {
    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClick}
            className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 cursor-pointer hover:bg-muted transition-colors"
        >
            <div
                className={cn(
                    'w-2 h-8 rounded-full',
                    votacao.status === 'APROVADO' && 'bg-green-500',
                    votacao.status === 'REJEITADO' && 'bg-red-500',
                    votacao.status === 'EM_ANDAMENTO' && 'bg-blue-500',
                    votacao.status === 'ARQUIVADO' && 'bg-gray-400'
                )}
            />
            <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{votacao.titulo}</p>
                <p className="text-xs text-muted-foreground">
                    {new Date(votacao.data).toLocaleDateString('pt-BR')} • {votacao.statusLabel}
                </p>
            </div>
        </motion.div>
    );
}
