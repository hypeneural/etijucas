import { useState, useEffect, useCallback } from 'react';
import { useTenantNavigate } from '@/hooks';
import { motion, AnimatePresence } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Phone,
    Mail,
    MapPin,
    Shield,
    Eye,
    EyeOff,
    Save,
    Loader2,
    Check,
    LogOut,
    ChevronRight,
    Settings,
    Bell,
    Lock,
    Trash2,
    AlertTriangle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { AvatarUpload, AddressAutocomplete } from '@/components/auth';
import { BottomTabBar, TabId } from '@/components/layout/BottomTabBar';
import { useAuthStore } from '@/store/useAuthStore';
import { useAppStore } from '@/store/useAppStore';
import { formatPhone } from '@/services/auth.service';
import { userService } from '@/services/user.service';
import { cn } from '@/lib/utils';
import { PASSWORD_REGEX, mapAuthError } from '@/lib/auth-utils';
import type { Address } from '@/types/auth.types';

type EditSection = 'profile' | 'address' | 'password' | 'notifications' | null;

export default function ProfilePage() {
    const navigate = useTenantNavigate();
    const { user, updateUser, logout, isAuthenticated } = useAuthStore();

    // Form state
    const [nome, setNome] = useState(user?.nome || '');
    const [email, setEmail] = useState(user?.email || '');
    const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || '');


    const [address, setAddress] = useState<Partial<Address>>(user?.address as Partial<Address> || {});

    // Password change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);

    // Notification preferences (synced from user)
    const [notifyReports, setNotifyReports] = useState(user?.notificationSettings?.reportsEnabled ?? true);
    const [notifyEvents, setNotifyEvents] = useState(user?.notificationSettings?.eventsEnabled ?? true);
    const [notifyAlerts, setNotifyAlerts] = useState(user?.notificationSettings?.alertsEnabled ?? true);

    // UI state
    const [activeSection, setActiveSection] = useState<EditSection>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [saveSuccess, setSaveSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Redirect if not logged in
    useEffect(() => {
        if (!isAuthenticated) {
            navigate('/login');
        }
    }, [isAuthenticated, navigate]);

    // Handle avatar upload

    const handleAvatarUpload = useCallback(async (file: File | null) => {
        if (!file) return;

        try {
            const response = await userService.uploadAvatar(file);

            // Update local state
            setAvatarUrl(response.url);

            // Update user in store/cache
            if (user) {
                updateUser({
                    ...user,
                    avatarUrl: response.url
                });
            }

        } catch (error) {
            console.error('Avatar upload failed:', error);
            setError(mapAuthError(error));
        }
    }, [user, updateUser]);

    const handleAvatarRemove = useCallback(async () => {
        try {
            await userService.removeAvatar();
            setAvatarUrl('');
            if (user) {
                updateUser({ ...user, avatarUrl: undefined });
            }
        } catch (error) {
            console.error('Avatar remove failed:', error);
            setError('Falha ao remover avatar');
        }
    }, [user, updateUser]);

    // Save profile
    const handleSaveProfile = useCallback(async () => {
        if (!nome.trim()) {
            setError('Nome é obrigatório');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {


            // Update profile via API
            const updatedUser = await userService.updateProfile({
                nome: nome.trim(),
                email: email.trim() || undefined,
            });

            // Update store with API response
            updateUser(updatedUser);

            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                setActiveSection(null);
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    }, [nome, email, updateUser]);

    // Save address
    const handleSaveAddress = useCallback(async () => {
        if (!address.cep || !address.logradouro) {
            setError('Preencha o endereço completo');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            // Update profile with address via API
            const updatedUser = await userService.updateProfile({
                address: address as unknown as import('@/types/api.types').AddressDTO,
            });

            updateUser(updatedUser);

            setSaveSuccess(true);
            setTimeout(() => {
                setSaveSuccess(false);
                setActiveSection(null);
            }, 1500);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Erro ao salvar');
        } finally {
            setIsSaving(false);
        }
    }, [address, updateUser]);

    // Change password
    const handleChangePassword = useCallback(async () => {
        if (!currentPassword || !newPassword || !confirmPassword) {
            setError('Preencha todos os campos de senha');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('As senhas não conferem');
            return;
        }

        if (!PASSWORD_REGEX.test(newPassword)) {
            setError('A nova senha deve ter min. 8 chars, maiúscula, minúscula e número.');
            return;
        }

        setIsSaving(true);
        setError(null);

        try {
            await userService.changePassword({
                currentPassword,
                newPassword,
                confirmPassword,
            });

            setSaveSuccess(true);
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');

            setTimeout(() => {
                setSaveSuccess(false);
                setActiveSection(null);
            }, 1500);
        } catch (err) {
            setError(mapAuthError(err));
        } finally {
            setIsSaving(false);
        }
    }, [currentPassword, newPassword, confirmPassword]);

    // Handle logout
    const handleLogout = useCallback(() => {
        logout();
        navigate('/login');
    }, [logout, navigate]);

    const { setActiveTab } = useAppStore();

    const handleTabChange = useCallback((tab: TabId) => {
        setActiveTab(tab);
        navigate('/');
    }, [setActiveTab, navigate]);

    if (!user) {
        return null;
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10">
            {/* Header */}
            <motion.header
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky top-0 z-50 bg-background/80 backdrop-blur-lg border-b"
            >
                <div className="flex items-center justify-between p-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => activeSection ? setActiveSection(null) : navigate(-1)}
                        className="rounded-xl"
                    >
                        <ArrowLeft className="h-5 w-5" />
                    </Button>

                    <h1 className="font-semibold text-lg">
                        {activeSection === 'profile' ? 'Editar Perfil' :
                            activeSection === 'address' ? 'Editar Endereço' :
                                activeSection === 'password' ? 'Alterar Senha' :
                                    activeSection === 'notifications' ? 'Notificações' :
                                        'Minha Conta'}
                    </h1>

                    <div className="w-10" />
                </div>
            </motion.header>

            <div className="p-4 pb-24 space-y-6">
                <AnimatePresence mode="wait">
                    {/* Main Profile View */}
                    {!activeSection && (
                        <motion.div
                            key="main"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 20 }}
                            className="space-y-6"
                        >
                            {/* Avatar Section */}
                            <Card className="p-6 text-center">
                                <AvatarUpload
                                    currentUrl={user.avatarUrl}
                                    name={user.nome}
                                    onUpload={handleAvatarUpload}
                                    onRemove={handleAvatarRemove}
                                    size="lg"
                                />

                                <h2 className="text-xl font-bold mt-4">{user.nome}</h2>
                                <p className="text-muted-foreground flex items-center justify-center gap-1">
                                    <Phone className="h-4 w-4" />
                                    {formatPhone(user.phone)}
                                </p>

                                {user.phoneVerified && (
                                    <div className="mt-2 inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-xs">
                                        <Check className="h-3 w-3" />
                                        Verificado
                                    </div>
                                )}
                            </Card>

                            {/* Menu Options */}
                            <div className="space-y-2">
                                {/* Edit Profile */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection('profile')}
                                    className="w-full flex items-center justify-between p-4 bg-card rounded-xl border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-primary/10">
                                            <User className="h-5 w-5 text-primary" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Dados pessoais</p>
                                            <p className="text-xs text-muted-foreground">Nome, e-mail e foto</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </motion.button>

                                {/* Edit Address */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection('address')}
                                    className="w-full flex items-center justify-between p-4 bg-card rounded-xl border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <MapPin className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Endereço</p>
                                            <p className="text-xs text-muted-foreground">
                                                {(() => {
                                                    const addr = user.address as unknown as { localidade?: string; uf?: string; bairro?: string } | null;
                                                    if (!addr || (!addr.localidade && !addr.bairro)) {
                                                        return 'Cadastre seu endereço';
                                                    }
                                                    const parts = [addr.bairro, addr.localidade, addr.uf].filter(Boolean);
                                                    return parts.join(', ') || 'Cadastre seu endereço';
                                                })()}
                                            </p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </motion.button>

                                {/* Change Password */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection('password')}
                                    className="w-full flex items-center justify-between p-4 bg-card rounded-xl border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/10">
                                            <Lock className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Alterar senha</p>
                                            <p className="text-xs text-muted-foreground">Trocar sua senha de acesso</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </motion.button>

                                {/* Notifications */}
                                <motion.button
                                    whileTap={{ scale: 0.98 }}
                                    onClick={() => setActiveSection('notifications')}
                                    className="w-full flex items-center justify-between p-4 bg-card rounded-xl border"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-purple-500/10">
                                            <Bell className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div className="text-left">
                                            <p className="font-medium">Notificações</p>
                                            <p className="text-xs text-muted-foreground">Configurar alertas</p>
                                        </div>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                                </motion.button>
                            </div>

                            {/* Logout Button */}
                            <Button
                                variant="outline"
                                size="lg"
                                onClick={handleLogout}
                                className="w-full h-14 rounded-2xl text-red-500 border-red-200 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950/30"
                            >
                                <LogOut className="h-5 w-5 mr-2" />
                                Sair da conta
                            </Button>
                        </motion.div>
                    )}

                    {/* Edit Profile Section */}
                    {activeSection === 'profile' && (
                        <motion.div
                            key="profile"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="p-6">
                                <AvatarUpload
                                    currentUrl={avatarUrl}
                                    name={nome}
                                    onUpload={handleAvatarUpload}
                                    onRemove={handleAvatarRemove}
                                    size="lg"
                                />
                            </Card>

                            <Card className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <User className="h-4 w-4" />
                                        Nome completo
                                    </Label>
                                    <Input
                                        type="text"
                                        value={nome}
                                        onChange={(e) => setNome(e.target.value)}
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Mail className="h-4 w-4" />
                                        E-mail
                                    </Label>
                                    <Input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="seu@email.com"
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Phone className="h-4 w-4" />
                                        WhatsApp
                                    </Label>
                                    <Input
                                        type="tel"
                                        value={formatPhone(user.phone)}
                                        disabled
                                        className="h-12 bg-muted"
                                    />
                                    <p className="text-xs text-muted-foreground">
                                        O número de WhatsApp não pode ser alterado
                                    </p>
                                </div>
                            </Card>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </p>
                                </motion.div>
                            )}

                            <Button
                                size="lg"
                                onClick={handleSaveProfile}
                                disabled={isSaving}
                                className={cn(
                                    'w-full h-14 rounded-2xl text-lg font-semibold',
                                    saveSuccess
                                        ? 'bg-green-600 hover:bg-green-600'
                                        : 'bg-gradient-to-r from-primary to-primary/80'
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <Check className="h-5 w-5 mr-2" />
                                        Salvo!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Salvar alterações
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {/* Edit Address Section */}
                    {activeSection === 'address' && (
                        <motion.div
                            key="address"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="p-4">
                                <AddressAutocomplete
                                    value={address}
                                    onChange={setAddress}
                                />
                            </Card>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </p>
                                </motion.div>
                            )}

                            <Button
                                size="lg"
                                onClick={handleSaveAddress}
                                disabled={isSaving}
                                className={cn(
                                    'w-full h-14 rounded-2xl text-lg font-semibold',
                                    saveSuccess
                                        ? 'bg-green-600 hover:bg-green-600'
                                        : 'bg-gradient-to-r from-primary to-primary/80'
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Salvando...
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <Check className="h-5 w-5 mr-2" />
                                        Salvo!
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-5 w-5 mr-2" />
                                        Salvar endereço
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {/* Change Password Section */}
                    {activeSection === 'password' && (
                        <motion.div
                            key="password"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-6"
                        >
                            <Card className="p-4 space-y-4">
                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Shield className="h-4 w-4" />
                                        Senha atual
                                    </Label>
                                    <div className="relative">
                                        <Input
                                            type={showPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="h-12 pr-12"
                                        />
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="icon"
                                            className="absolute right-2 top-1/2 -translate-y-1/2"
                                            onClick={() => setShowPassword(!showPassword)}
                                        >
                                            {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Nova senha
                                    </Label>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="Mínimo 6 caracteres"
                                        className="h-12"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label className="flex items-center gap-2">
                                        <Lock className="h-4 w-4" />
                                        Confirmar nova senha
                                    </Label>
                                    <Input
                                        type={showPassword ? 'text' : 'password'}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className={cn(
                                            'h-12',
                                            confirmPassword && newPassword !== confirmPassword && 'border-red-400'
                                        )}
                                    />
                                    {confirmPassword && newPassword !== confirmPassword && (
                                        <p className="text-xs text-red-500">As senhas não conferem</p>
                                    )}
                                </div>
                            </Card>

                            {error && (
                                <motion.div
                                    initial={{ opacity: 0, y: -10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800"
                                >
                                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                                        <AlertTriangle className="h-4 w-4" />
                                        {error}
                                    </p>
                                </motion.div>
                            )}

                            <Button
                                size="lg"
                                onClick={handleChangePassword}
                                disabled={isSaving || !currentPassword || !newPassword || !confirmPassword}
                                className={cn(
                                    'w-full h-14 rounded-2xl text-lg font-semibold',
                                    saveSuccess
                                        ? 'bg-green-600 hover:bg-green-600'
                                        : 'bg-gradient-to-r from-primary to-primary/80'
                                )}
                            >
                                {isSaving ? (
                                    <>
                                        <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                                        Alterando...
                                    </>
                                ) : saveSuccess ? (
                                    <>
                                        <Check className="h-5 w-5 mr-2" />
                                        Senha alterada!
                                    </>
                                ) : (
                                    <>
                                        <Shield className="h-5 w-5 mr-2" />
                                        Alterar senha
                                    </>
                                )}
                            </Button>
                        </motion.div>
                    )}

                    {/* Notifications Section */}
                    {activeSection === 'notifications' && (
                        <motion.div
                            key="notifications"
                            initial={{ opacity: 0, x: 20 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: -20 }}
                            className="space-y-4"
                        >
                            <Card className="p-4 space-y-4">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-green-500/10">
                                            <MapPin className="h-5 w-5 text-green-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Minhas observações</p>
                                            <p className="text-xs text-muted-foreground">Atualizações sobre suas observações</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={notifyReports}
                                        onCheckedChange={setNotifyReports}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-blue-500/10">
                                            <Bell className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Eventos</p>
                                            <p className="text-xs text-muted-foreground">Novos eventos na cidade</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={notifyEvents}
                                        onCheckedChange={setNotifyEvents}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-lg bg-amber-500/10">
                                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div>
                                            <p className="font-medium">Alertas</p>
                                            <p className="text-xs text-muted-foreground">Alertas importantes da cidade</p>
                                        </div>
                                    </div>
                                    <Switch
                                        checked={notifyAlerts}
                                        onCheckedChange={setNotifyAlerts}
                                    />
                                </div>
                            </Card>

                            <p className="text-xs text-muted-foreground text-center px-4">
                                Você receberá notificações via WhatsApp para as opções ativadas
                            </p>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>

            {/* Bottom Tab Bar */}
            <BottomTabBar activeTab="mais" onTabChange={handleTabChange} />
        </div>
    );
}
