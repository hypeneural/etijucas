# Deploy Checklist - ETijucas

> **Ambiente de Produção:** Plesk (CloudLinux com chroot)
> **PHP Requerido:** 8.2+ (usar caminho completo no SSH)

---

## 🖥️ Pré-Deploy (Local)

```bash
# 1. Gerar SDK atualizado
pnpm sdk:gen

# 2. Build do frontend (output vai para apps/api/public/app)
pnpm prod:build

# 3. Verificar que o build foi criado
ls apps/api/public/app/

# 4. Commit e push
git add -A
git commit -m "build: production deploy"
git push origin main
```

---

## 🚀 Deploy no Servidor (Plesk SSH)

### 1. Conectar via SSH

```bash
ssh usuario@seu-servidor.com.br
```

### 2. Criar Alias do PHP (Importante!)

O PHP padrão do sistema é antigo (7.2). Use o PHP 8.3 do Plesk:

```bash
# Rode isso toda vez que logar:
alias php='/opt/plesk/php/8.3/bin/php'
alias composer='/opt/plesk/php/8.3/bin/php /usr/lib64/plesk-9.0/composer.phar'
```

### 3. Atualizar Código

```bash
cd httpdocs
git pull origin main
```

### 4. Instalar Dependências e Cachear

```bash
# Dependências PHP (produção)
composer install --no-dev --optimize-autoloader

# Limpar e cachear configs
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# Rodar migrations (se houver)
php artisan migrate --force

# Linkar storage (se necessário)
php artisan storage:link

# Reiniciar queue workers (se usar)
php artisan queue:restart
```

---

## ✅ Verificação Pós-Deploy

- [ ] API respondendo em `/api/v1/bairros`
- [ ] Frontend carregando em `/`
- [ ] Login funcionando (sem erro 419)
- [ ] Rotas do SPA funcionando (ex: `/events`, `/profile`)
- [ ] Imagens carregando de `/storage/...`

---

## 🆘 Troubleshooting

### Erro 419 (CSRF Token Mismatch)

Verifique o `.env` no servidor:

```env
SANCTUM_STATEFUL_DOMAINS=seudominio.com.br,www.seudominio.com.br
SESSION_DOMAIN=.seudominio.com.br
SESSION_SECURE_COOKIE=true
```

Depois limpe o cache:

```bash
php artisan config:clear
php artisan config:cache
```

### Erro 500 / Página em Branco

```bash
# Ver logs do Laravel
tail -f storage/logs/laravel.log

# Verificar permissões
chmod -R 775 storage bootstrap/cache
```

### SPA não carrega (404 em rotas)

Verifique se o `.htaccess` em `httpdocs/apps/api/public/` está correto. Ele deve ter regras para fallback da SPA.

---

## ⏪ Rollback

```bash
# Se algo der errado
git checkout HEAD~1
composer install --no-dev --optimize-autoloader
php artisan config:cache
php artisan route:cache
```

---

> **Nota**: O build do React fica em `apps/api/public/app/`.
> Não precisa de Node.js no servidor de produção!
