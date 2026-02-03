# 🐛 Análise de Erros de Produção

> **Status:** Diagnóstico completo.
> **Resumo:** 2 Erros Críticos identificados.

---

## 1. Erro 419: CSRF token mismatch (Login/Forgot Password)

**O que está acontecendo:**
O frontend tenta fazer POST para `/auth/forgot-password`. O Laravel rejeita porque o token de segurança (CSRF) não bate ou o cookie de sessão foi recusado.

**Por que:**
O Laravel Sanctum é configurado para funcionar em modo "Stateful" (com cookies) apenas em domínios confiáveis. Em produção (`etijucas.com.br`), se o domínio não estiver explicitamente liberado, ele trata como uma requisição externa e exige token manual (que o navegador não envia automaticamente da forma esperada em requests stateful).

**👉 Solução (No Servidor /.env):**

Você precisa atualizar o arquivo `.env` na pasta `apps/api/` do servidor com estas variáveis EXATAS:

```env
# Define que o domínio etijucas.com.br é confiável para cookies
SANCTUM_STATEFUL_DOMAINS=etijucas.com.br,www.etijucas.com.br

# Define o domínio do cookie de sessão (importante!)
SESSION_DOMAIN=.etijucas.com.br

# Garante que cookies só trafegam em HTTPS
SESSION_SECURE_COOKIE=true
```

Após alterar, rode:
```bash
php artisan config:clear
```

---

## 2. Erro 404: /api/v1/tourism/spots

**O que está acontecendo:**
O frontend tenta buscar pontos turísticos, mas o servidor devolve `404 Not Found`.

**Por que:**
Eu analisei o código do backend (`apps/api/routes/api.php`) e **a rota de turismo não existe**. Além disso, procurei pelo `TourismController` no backend e ele **não foi criado ainda**.

A feature existe no Front, existe no Contrato (OpenAPI), mas **falta implementar no Back**.

**👉 Solução:**

Precisamos criar a feature no backend (scaffold incompleto).

**Passo a passo para corrigir:**
1.  Criar `TourismController`.
2.  Criar Model `TourismSpot` e Migration.
3.  Registrar a rota em `routes/api.php`.

---

## 🛠️ Resumo das Ações Necessárias

| Ação | Onde | Urgência |
|------|------|----------|
| **Atualizar .env** (SANCTUM/SESSION) | Servidor (Plesk) | 🔴 Imediata (Bloqueia Login) |
| **Limpar Cache** (`config:clear`) | Servidor (Plesk) | 🔴 Imediata |
| **Implementar Backend Turismo** | Código (VSCode) | 🟡 Média (Funcionalidade faltando) |

---

## 🔒 Dicas de Segurança Adicionais

Para "deixar mais seguro e otimizado" como você pediu:

1.  **Strict Transport Security (HSTS):** No `.htaccess` ou configuração do Nginx, force HTTPS estrito. (Já adicionei headers no .htaccess, verifique se estão ativos).
2.  **Rate Limiting:** Já aplicamos em rotas de auth. OK.
3.  **Logs de Erro:** O Laravel loga erros em `storage/logs/`. Monitore esses logs para ver detalhes de falhas internas (500).
