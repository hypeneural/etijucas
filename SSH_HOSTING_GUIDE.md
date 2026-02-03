# 🐧 Guia de Sobrevivência: Acesso SSH em Hospedagem Compartilhada (eTijucas)

> **Status:** ✅ Validado.
> **Resumo:** Ambiente CloudLinux com CageFS (Chroot). PHP 8.3 disponível via Plesk.

---

## � Diagnóstico do Ambiente (O que descobrimos)

| Item | Status | Detalhe |
|---|---|---|
| **Sistema** | CloudLinux / CageFS | Ambiente "enjaulado" (Chroot). Você só vê seus arquivos. |
| **PHP Padrão** | ❌ 7.2.24 | Muito antigo para o projeto. Não use `php artisan` direto. |
| **PHP 8.2 (Alt)** | ⚠️ Com Erros | `/opt/alt/php82/...` está com módulos quebrados (mysqli). Evite. |
| **PHP 8.2 (Plesk)** | ✅ OK, mas antigo | `/opt/plesk/php/8.2/bin/php` funciona. |
| **PHP 8.3 (Plesk)** | 🚀 **RECOMENDADO** | `/opt/plesk/php/8.3/bin/php` está perfeito e atualizado. |
| **Estrutura** | `/var/www/vhosts/etijucas.com.br` | Sua home correta. |
| **Document Root** | `httpdocs` | Pasta pública do site. É aqui que você deve entrar. |

---

## � Como Operar no Dia a Dia

### 1. Preparar o Terminal (Sempre que logar)

Copie e cole este comando assim que entrar no SSH. Ele cria um atalho para o PHP 8.3 correto:

```bash
alias php='/opt/plesk/php/8.3/bin/php'
alias composer='/opt/plesk/php/8.3/bin/php /usr/lib64/plesk-9.0/composer.phar'
```

Agora você pode rodar `php -v` e ver a versão 8.3.30! 🎉

### 2. Fluxo de Atualização (Deploy)

Sempre entre na pasta e puxe as atualizações:

```bash
cd httpdocs
git pull origin main
```

### 3. Rodar Comandos do Laravel

Com o alias criado no passo 1, agora você pode rodar os comandos normalmente:

```bash
# Instalar dependências (se mudou o composer.json)
composer install --no-dev --optimize-autoloader

# Migrar banco de dados
php artisan migrate --force

# Limpar caches (Essencial!)
php artisan config:cache
php artisan route:cache
php artisan view:cache

# Linkar storage (se sumiu imagens)
php artisan storage:link
```

---

## 🚫 Soluções para Limitações (Troubleshooting)

| Problema | Solução |
|---|---|
| `command not found: npm` | **Jamais tente rodar npm no servidor.** O build do React (frontend) é feito na sua máquina local (`pnpm prod:build`) e os arquivos da pasta `public/app` sobem via Git. O servidor só serve estáticos. |
| `command not found: redis` | Se precisar limpar cache do Redis sem CLI, use `php artisan cache:clear`. |
| `OpenSSL Error` no composer | Use o comando completo do composer que passei no alias acima (ele usa o PHP 8.3 e o phar correto). |
| `permission denied` | Se tiver erro de permissão em `storage`, rode: `chmod -R 775 storage bootstrap/cache` (dentro de `apps/api` ou raiz). |

---

## 📝 Cheatsheet Rápido

```bash
# 1. Login
# 2. Alias
alias php='/opt/plesk/php/8.3/bin/php'

# 3. Navegar
cd httpdocs

# 4. Atualizar
git pull
php artisan migrate --force
php artisan config:cache
```
