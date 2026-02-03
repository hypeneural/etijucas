# eTijucas API

API backend da plataforma eTijucas. Este README documenta a stack, os complementos usados, as features ja implementadas, os endpoints principais e oportunidades de melhoria futura.

## Visao geral

- API versionada em `/api/v1`
- Autenticacao baseada em tokens (Laravel Sanctum)
- Registro e login orientados por telefone + OTP via WhatsApp
- Dados principais: usuarios, bairros, roles/permissoes, OTPs e midia de avatar

## Stack principal

- PHP 8.2+
- Laravel 12
- Banco de dados: SQLite (padrao local) ou MySQL/PostgreSQL (suportados pelo Laravel)
- Cache/Queue: drivers do Laravel (padrao atual em `.env.example` e `database`)
- Node.js + Vite (assets e tooling)

## Complementos e integracoes

- Laravel Sanctum (tokens de acesso e refresh)
- Spatie Permission (RBAC: roles e permissoes)
- Spatie Media Library (upload/gestao de avatar)
- Spatie Query Builder (filtros e ordenacao para admin)
- Ramsey UUID (UUIDs em modelos)
- Z-API (envio de WhatsApp para OTP)
- Tailwind + Vite (front/tooling interno)
- Axios + Concurrently (utilitarios de dev)

## O que ja foi feito

- OTP via WhatsApp:
  - Envio/validacao/reenvio
  - Expiracao de 5 minutos
  - Limite de tentativas por codigo
  - Rate limit extra em cache (3 solicitacoes por 5 min)
  - Fallback em modo dev: mensagem logada se Z-API nao estiver configurado
- Autenticacao:
  - Login por telefone + senha
  - Registro apos verificacao de telefone
  - Refresh token dedicado (ability `refresh`)
  - Logout do dispositivo atual ou de todos os dispositivos
- Perfil do usuario:
  - Consulta e atualizacao de perfil
  - Preferencias de notificacao (JSON)
  - Avatar com upload e conversoes (`thumb` 150x150 e `medium` 300x300)
  - Remocao de avatar
- Dados publicos:
  - Lista de bairros ativos, com cache HTTP
- Admin:
  - Listagem de usuarios com filtros, ordenacao e paginacao
  - Atualizacao e soft delete
  - Atribuicao de roles (apenas admin)
- Seeders:
  - Roles e permissoes base (user/moderator/admin)
  - Bairros iniciais
- Middleware de cache HTTP com perfis `static`, `semi-static`, `user` e `dynamic`
- UUIDs em `users` e `bairros`, soft delete em usuarios

## Endpoints principais

Publicos:

- `POST /api/v1/auth/send-otp`
- `POST /api/v1/auth/verify-otp`
- `POST /api/v1/auth/resend-otp`
- `POST /api/v1/auth/login`
- `POST /api/v1/auth/register`
- `GET  /api/v1/bairros`

Autenticados (`Authorization: Bearer <token>`):

- `POST /api/v1/auth/refresh`
- `POST /api/v1/auth/logout`
- `GET  /api/v1/auth/me`
- `GET  /api/v1/users/me`
- `PUT  /api/v1/users/me`
- `POST /api/v1/users/me/avatar`
- `DELETE /api/v1/users/me/avatar`
- `PUT  /api/v1/users/me/notifications`

Admin (`role: admin|moderator`):

- `GET    /api/v1/admin/users`
- `GET    /api/v1/admin/users/{id}`
- `PUT    /api/v1/admin/users/{id}`
- `DELETE /api/v1/admin/users/{id}`
- `POST   /api/v1/admin/users/{id}/roles` (somente admin)

Filtros de admin (`Spatie Query Builder`):

- `filter[bairro_id]`, `filter[phone_verified]`, `filter[verified]`
- `filter[search]=nome|email|phone`
- `filter[role]=admin|moderator|user`
- `sort=nome,-created_at` (exemplos)

## Modelos e dados

- `users` (UUID, telefone, email, nome, endereco JSON, avatar_url, notification_settings, soft delete)
- `bairros` (UUID, nome, slug, active)
- `otp_codes` (controle de OTP)
- `password_resets` (estrutura pronta, fluxo ainda nao implementado)
- `roles`, `permissions` e pivots (Spatie Permission)
- `media` (Spatie Media Library)

## Padroes de resposta

- Responses em JSON
- Recursos transformados em camelCase via `UserResource`
- Erros de validacao retornam mensagens em portugues (rules customizadas)

## Configuracao local

Requisitos:

- PHP 8.2+
- Composer
- Node.js 18+ (para Vite)
- Banco de dados (SQLite local ou MySQL/PostgreSQL)

Passo a passo:

```bash
composer install
copy .env.example .env
php artisan key:generate
php artisan migrate --seed
php artisan storage:link
npm install
npm run build
php artisan serve
```

Atalho de setup:

```bash
composer run setup
```

Dev com processos paralelos (API + queue + logs + Vite):

```bash
composer run dev
```

## Variaveis de ambiente principais

- `APP_NAME`, `APP_ENV`, `APP_KEY`, `APP_URL`
- `DB_CONNECTION`, `DB_DATABASE`, `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`
- `CACHE_STORE`, `QUEUE_CONNECTION`, `SESSION_DRIVER`
- `SANCTUM_STATEFUL_DOMAINS`
- `ZAPI_INSTANCE_ID`, `ZAPI_TOKEN`, `ZAPI_CLIENT_TOKEN`
- `MEDIA_DISK`, `MEDIA_QUEUE`, `IMAGE_DRIVER`

## Melhorias futuras (oportunidades)

- Implementar modulos previstos nas permissoes: eventos, alertas, telefones uteis, lixo, missas, reports, topics e comments
- Fluxo completo de reset de senha (OTP ou token)
- Documentacao OpenAPI/Swagger e exemplos de requests
- Suite de testes (Feature/Unit) para auth, OTP e admin
- Jobs agendados para limpeza de OTPs e rotinas de manutencao
- Observabilidade (metrics, tracing, alertas)
- Hardening de seguranca (rate limit global, IP allowlist em admin, auditoria)
- CI/CD com lint, testes e deploy automatizado

## Notas

- Se as credenciais da Z-API nao estiverem configuradas, o envio de OTP sera registrado em log.
- Para avatars, e recomendado garantir que o disco `public` esteja acessivel via `storage:link`.
