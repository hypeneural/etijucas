# 🛡️ Auditoria de Segurança: ETijucas

> **Data:** 03/02/2026
> **Escopo:** Autenticação, Validação de Dados, Sessão e Infraestrutura.
> **Status Geral:** 🟠 Médio Risco (Principalmente devido à configurações de produção).

---

## 🚨 Vulnerabilidades Críticas (Prioridade Alta)

### 1. Confusão de Modos de Autenticação (SPA vs API Token)
**O Problema**: O sistema usa o Laravel Sanctum, que suporta dois modos: (1) Cookies (Stateful) para SPA e (2) Tokens (Bearer) para Mobile/API. O frontend está tentando usar cookies (Stateful) mas o backend emite tokens manuais (`createToken`). Isso gera erros de CSRF (419) e confusão.
**Risco**: Bloqueio de usuários legítimos ou vulnerabilidade a CSRF se configurado incorretamente.
**Correção**:
*   Decidir um único modo. Para PWA/Mobile First, **Recomendo usar Tokens (Auth Bearer)**.
*   Frontend deve pegar o `token` da resposta de login e enviar no Header `Authorization: Bearer <token>`.
*   Backend não deve exigir CSRF para rotas API se usar apenas Tokens.

### 2. Expiração de Tokens (Sessão Infinita)
**O Problema**: A configuração `fluxo de refresh` gera tokens de 7 ou 30 dias, mas a configuração `sanctum.expiration` padrão costuma ser NULL (nunca expira no banco se não checado).
**Risco**: Se um token vazar, ele vale por muito tempo.
**Correção**: Explicitamente definir `SANCTUM_EXPIRATION=120` (minutos) no `.env` e rodar a task `sanctum:prune-expired` via Cron Job.

### 3. Validação de Senha Fraca
**O Problema**: `RegisterRequest` exige apenas `min:8`. Senhas como "12345678" são aceitas.
**Risco**: Facilidade de Brute Force.
**Correção**: Usar `Password::defaults()` do Laravel e configurar:
```php
Password::min(8)->mixedCase()->letters()->numbers()->symbols()->uncompromised()
```

---

## ⚠️ Vulnerabilidades Médias (Prioridade Média)

### 4. "Spam" de Bairros
**O Problema**: No registro, se o bairro não existe, ele é criado automaticamente (`ensureExists`). Não há limite de taxa específico para criação de bairros.
**Risco**: Um atacante pode registrar 10.000 usuários com bairros aleatórios ("Bairro A", "Bairro B"...), poluindo o banco.
**Correção**:
*   Limitar criação automática apenas para cadastros vindos de IPs confiáveis ou exigir aprovação de moderador para novos bairros.
*   Ou: Validar contra uma lista fixa de bairros oficiais de Tijucas.

### 5. Armazenamento de OTP
**O Problema**: O código do OTP (4 dígitos) é salvo em texto plano no banco.
**Risco**: Se alguém tiver acesso leitura ao banco, pode ver os códigos em tempo real e sequestrar contas.
**Correção**: Armazenar o Hash do OTP (`Hash::make($code)`) e verificar com `Hash::check()`.

### 6. Rate Limiting por IP (DDoS)
**O Problema**: Temos `throttle` por usuário/rota, mas em produção (Plesk), é essencial configurar o **Fail2Ban** ou **Rate Limiting do Nginx**.
**Risco**: Ataque volumétrico derrubar o servidor antes de chegar no Laravel.

---

## ✅ Boas Práticas Já Implementadas

*   **SQL Injection**: O uso do Eloquent ORM protege contra 99% dos casos. O código auditado não usa queries brutas (`DB::raw`) inseguras.
*   **XSS**: O React escapa conteúdo por padrão. O Backend retorna JSON, reduzindo risco de XSS refletido.
*   **Idempotência**: Implementada para éviter duplo processamento de pagamentos/ações.
*   **Rate Limit Auth**: Rotas de login/otp têm limites estritos (3 a 10 tentativas).

---

## 📝 Plano de Ação (Vibecoding Security)

### Imediato (Hoje)
1.  [ ] Configurar `.env` para definir se usamos Cookies ou Tokens (Recomendo Tokens para simplificar).
2.  [ ] Alterar `RegisterRequest` para exigir senhas complexas.

### Curto Prazo (Essa semana)
3.  [ ] Configurar Cron Job: `php artisan sanctum:prune-expired`.
4.  [ ] Implementar Hash para OTPs.
5.  [ ] Criar lista fixa de Bairros de Tijucas (Seed) e remover criação automática pública.

### Longo Prazo
6.  [ ] Implementar 2FA (Autenticação de Dois Fatores) para Admins.
7.  [ ] Auditoria de Dependências (`composer audit`).
