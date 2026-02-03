# 📋 Auditoria de Documentação - ETijucas

> **Data:** 03/02/2026
> **Arquivos Analisados:** `ARCHITECTURE.md`, `CONTRIBUTING.md`, `README.md`, `DEPLOY.md`, `CHECKLIST.md`

---

## ✅ Status Geral: BOM

As documentações estão **bem atualizadas** e refletem o estado atual do repositório. Todos os comandos documentados (`make:crud`, `mocks:gen`, `msw:init`) existem em `tools/`.

---

## 📊 Análise por Arquivo

| Arquivo | Páginas | Status | Problemas |
|---------|---------|--------|-----------|
| `README.md` | 307 linhas | ✅ Atualizado | Nenhum crítico |
| `ARCHITECTURE.md` | 166 linhas | ✅ Atualizado | Nenhum crítico |
| `CONTRIBUTING.md` | 210 linhas | ✅ Atualizado | Nenhum crítico |
| `DEPLOY.md` | 64 linhas | ⚠️ Incompleto | Falta SSH Guide |
| `CHECKLIST.md` | 182 linhas | ✅ Atualizado | Nenhum crítico |

---

## 🔍 Problemas Encontrados

### 1. Redundância de Informação
**Onde:** `README.md`, `ARCHITECTURE.md`, `DEPLOY.md`
**Problema:** Tabela de scripts repetida em 3 arquivos. Se adicionar novo script, precisa atualizar em 3 lugares.
**Solução Proposta:** Manter tabela completa apenas no `README.md`, outros arquivos linkam para lá.

### 2. DEPLOY.md Incompleto para Plesk
**Onde:** `DEPLOY.md`
**Problema:** Não menciona:
  - Uso do PHP 8.3 via caminho completo (`/opt/plesk/php/8.3/bin/php`)
  - Criação de alias no SSH
  - Configuração do `.htaccess`
**Solução Proposta:** Mesclar informações do `SSH_HOSTING_GUIDE.md` no `DEPLOY.md`.

### 3. Documentação de Segurança Dispersa
**Onde:** `SECURITY_AUDIT.md`, `API_DEBUG.md` (criados recentemente)
**Problema:** Informações de segurança e debug estão em arquivos separados, não linkados no README.
**Solução Proposta:** Adicionar seção "Troubleshooting" no README com links para esses arquivos.

### 4. CHECKLIST.md com Itens Manuais
**Onde:** `CHECKLIST.md` seção "Criar Nova Feature"
**Problema:** Checkboxes não marcáveis automaticamente. É guia, não checklist real.
**Solução Proposta:** Renomear seção ou converter para guia narrativo.

---

## 🎯 O Que Falta Fazer (Itens Pendentes Reais)

Baseado na análise do código e docs:

| Item | Prioridade | Onde Consertar |
|------|------------|----------------|
| Backend de Turismo (`/api/v1/tourism/spots`) | 🔴 Alta | Criar Controller + Route |
| Configurar `.env` produção (SANCTUM/SESSION) | 🔴 Alta | Servidor Plesk |
| Validação de senha forte | 🟡 Média | `RegisterRequest.php` |
| Linkar novos docs no README | 🟢 Baixa | `README.md` |
| Consolidar deploy docs | 🟢 Baixa | `DEPLOY.md` |

---

## 📝 Ações Recomendadas

### Imediato (Hoje)
1. ✏️ Atualizar `DEPLOY.md` com o guia de SSH/Plesk
2. ✏️ Adicionar links para `SECURITY_AUDIT.md` e `SSH_HOSTING_GUIDE.md` no `README.md`

### Opcional (Melhorias)
3. Remover tabela de scripts duplicada de `ARCHITECTURE.md`
4. Converter checklist de "Nova Feature" em template copiável

---

## 📁 Arquivos de Documentação Atuais

```
etijucas/
├── README.md                 # Principal, overview completo
├── ARCHITECTURE.md           # Regras e convenções técnicas
├── CONTRIBUTING.md           # Guia para devs contribuírem
├── CHECKLIST.md              # Validação de qualidade
├── DEPLOY.md                 # Passos de deploy
├── SECURITY_AUDIT.md         # Auditoria de segurança ⭐ NOVO
├── SSH_HOSTING_GUIDE.md      # Guia SSH Plesk ⭐ NOVO
├── API_DEBUG.md              # Debug de erros API ⭐ NOVO
├── VIBECODING_ROADMAP.md     # Roadmap de melhorias
└── OFFLINE_SYNC.md           # Documentação offline-first
```
