# Modelo de Moderacao

## user_restrictions

Tabela de restricoes aplicadas a usuarios.

Campos principais:
- id (uuid)
- user_id (uuid)
- type (enum) `suspend_login`, `mute_forum`, `shadowban_forum`, `block_uploads`, `rate_limit_forum`
- scope (enum) `global`, `forum`, `reports`, `uploads`
- reason (text)
- created_by (uuid)
- starts_at (timestamp)
- ends_at (timestamp nullable)
- revoked_at (timestamp nullable)
- revoked_by (uuid nullable)
- metadata (json nullable)
- timestamps

Regras:
- Ativa se `revoked_at` for null e (`ends_at` for null ou > now).

Scopes Eloquent:
- `active()`
- `expired()`
- `revoked()`

## content_flags

Fila de denuncias/flags.

Campos principais:
- id (uuid)
- content_type (enum) `topic`, `comment`, `report`, `user`
- content_id (uuid)
- reported_by (uuid nullable)
- reason (enum) `spam`, `personal_data`, `hate`, `violence`, `scam`, `misinformation`, `harassment`, `other`
- message (text nullable)
- status (enum) `open`, `reviewing`, `action_taken`, `dismissed`
- handled_by (uuid nullable)
- handled_at (timestamp nullable)
- action (enum) `none`, `hide`, `delete`, `warn_user`, `restrict_user`
- metadata (json nullable)
- timestamps

Indices:
- status + created_at
- content_type + content_id

## Observacoes

- Logs de atividade sao gerados automaticamente pelas models usando `spatie/laravel-activitylog`.
- Acoes de moderacao via painel (marcar em analise, dispensar, acao tomada) registram eventos no log.
