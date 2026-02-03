# Deploy Checklist - ETijucas

## Pré-Deploy (Local)

```bash
# 1. Gerar SDK atualizado
pnpm sdk:gen

# 2. Build do frontend (output vai para apps/api/public/app)
pnpm prod:build

# 3. Verificar que o build foi criado
ls apps/api/public/app/
```

## Deploy no Servidor

```bash
cd /path/to/etijucas/apps/api

# 1. Atualizar código
git pull origin main

# 2. Instalar dependências PHP (produção)
composer install --no-dev --optimize-autoloader

# 3. Limpar e cachear configs
php artisan config:cache
php artisan route:cache
php artisan view:cache
php artisan event:cache

# 4. Rodar migrations (se houver)
php artisan migrate --force

# 5. Otimizar autoloader
composer dump-autoload --optimize

# 6. Reiniciar queue workers (se usar)
php artisan queue:restart
```

## Verificação Pós-Deploy

- [ ] API respondendo em `/api/v1/health` ou similar
- [ ] Frontend carregando em `/`
- [ ] Login funcionando
- [ ] Rotas do SPA funcionando (ex: `/events`, `/profile`)

## Rollback

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
