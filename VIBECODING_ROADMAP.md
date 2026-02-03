# 🚀 Vibecoding Roadmap: Agilidade & Excelência no Desenvolvimento

> **Objetivo:** Transformar o desenvolvimento no ETijucas em uma experiência fluida ("vibecoding"), onde a infraestrutura não atrapalha, a arquitetura guia, e o código flui do pensamento para a produção com o mínimo de atrito.

---

## 🏗️ O Que Já Temos (A Fundação Sólida)

Já estabelecemos uma base muito superior a projetos tradicionais. A "Vibecoding v1" já está ativa com:

### 1. Arquitetura Feature-First (Espelhada)
*   **O que é:** Se existe uma feature `Forum` no Backend (`app/Domains/Forum`), existe uma feature `forum` no Frontend (`src/features/forum`).
*   **Ganho:** Navegação mental instantânea. Você sabe exatamente onde cada arquivo deve estar.
*   **Estado:** ✅ Implementado e validado.

### 2. Contrato como Fonte da Verdade
*   **O que é:** `contracts/openapi.yaml` define a API antes de codar. O Frontend gera o SDK automaticamente (`pnpm sdk:gen`).
*   **Ganho:** Fim dos erros de digitação ("era `user_id` ou `userId`?"). TypeScript autocompleta tudo. Frontend não quebra quando Backend muda (o build avisa).
*   **Estado:** ✅ Implementado (SDK gera types e client).

### 3. Geradores de Código (Scaffolding)
*   **O que é:** `pnpm make:feature` cria a estrutura de pastas.
*   **Ganho:** Elimina a fadiga de decisão ("onde salvo isso?") e o tédio de criar pastas vazias.
*   **Estado:** ⚠️ Básico (cria pastas, mas arquivos vêm vazios).

### 4. Offline-First "Grátis"
*   **O que é:** Middleware de Idempotência e Queue no Frontend.
*   **Ganho:** A feature nasce funcionando offline sem o dev pensar muito nisso.
*   **Estado:** ✅ Infraestrutura pronta.

---

## 🚧 Gargalos Atuais (Onde a "Vibe" Quebra)

Ainda existem pontos de atrito que nos tiram do "estado de fluxo":

1.  **Boilerplate Manual Backend:**
    *   Criar uma Feature nova exige criar manualmente: Migration, Model, Factory, Seeder, Controller, Request, Resource, Policy, Route, Test. É repetitivo e propenso a erro.
2.  **Boilerplate Manual Frontend:**
    *   Criar a UI base (List/Edit/Create) é sempre a mesma coisa (Table, Form com React Hook Form, Zod validation). Fazemos na mão hoje.
3.  **Sincronia Manual de Contrato:**
    *   Escrevemos o OpenAPI na mão. É poderoso, mas chato. Às vezes esquecemos de atualizar o YAML e o SDK fica defasado.
4.  **Feedback Loop de Testes:**
    *   Não temos testes confiáveis rodando no commit. O medo de quebrar algo antigo desacelera o desenvolvimento de coisas novas.

---

## ⚡ Plano de Aceleração (Vibecoding 2.0)

Para atingir a velocidade máxima, precisamos atacar estas 4 frentes:

### 1. Super-Geradores (Scaffolding Inteligente)

Melhorar o `make:feature` para ser interativo e gerar **código funcional**, não apenas pastas.

*   **Comando Ideal:** `pnpm make:crud --feature=Forum --model=Topic`
*   **O que deve fazer:**
    *   Perguntar os campos (title:string, content:text, user_id:foreign).
    *   **Backend:** Gerar Model, Migration, Controller (com CRUD completo), Request (com validação), Resource e Policy.
    *   **Frontend:** Gerar Zod Schema, Interfaces, Hook (useTopicQuery) e Componentes de Formulário.
    *   **Contrato:** Atualizar automaticamente o `openapi.yaml`.

### 2. Frontend Driven by Schema

Usar a tipagem forte do SDK para gerar formulários automaticamente.

*   **Proposta:** Criar componentes como `<AutoForm schema={CreateTopicSchema} />`.
*   **Ganho:** Em telas administrativas ou simples, não codamos HTML/Inputs. O Zod define a UI.
*   **Status:** *A pesquisar (zod-to-form, react-hook-form-auto).*

### 3. Mocking & Desenvolvimento Desacoplado

Permitir que o Frontend trabalhe mesmo se a API não estiver pronta.

*   **Ação:** O SDK deve ter um modo `mock: true`.
*   **Como:** Usar **MSW (Mock Service Worker)**. Ele intercepta requisições do SDK e retorna dados falsos baseados no OpenAPI Schema.
*   **Ganho:** Front não espera Back. Back não bloqueia Front.

### 4. CI/CD "Sem Medo"

Automatizar a verificação para que o deploy seja "apertar um botão e esquecer".

*   **GitHub Actions:**
    *   Jobs paralelos: Lint Back, Lint Front, Type Check, Test Back (Pest), Build Front.
    *   Preview Deploy: Cada PR gera uma URL temporária (via Vercel ou similar) para aprovação visual.

---

## 📚 Documentação & Onboarding

Para manter a organização sem burocracia, precisamos de:

### Documentação Viva
Em vez de wikis desatualizadas, usar o próprio código:
*   **Storybook:** Documentar componentes de UI (Botões, Cards, Inputs) isolados. Serve como catálogo para o dev não recriar o que já existe.
*   **Compodoc / PHPDoc:** Gerar diagrama de arquitetura automático.

### Guia de Decisão (Decision Log)
Um arquivo `ADR.md` (Architecture Decision Records) simples.
*   *"Por que usamos Zustand e não Redux?"* -> Link para a decisão.
*   Evita discussões circulares no futuro.

---

## ✅ Priorização Executável (P0–P3)

| Prioridade | Resultado | Entrega objetiva | DoD (definição de pronto) |
|---|---|---|---|
| **P0** | Scaffolding útil (CRUD real) | `pnpm make:crud` gera Model, Migration, Controller, Request, Resource, Policy, Test, Routes + front (schema Zod, hooks, form, page) + patch do OpenAPI | Rodar `pnpm make:crud` e ter CRUD funcional de exemplo com 1 teste green |
| **P0** | Contrato sempre sincronizado | `check:contracts` bloqueia PR, `sdk:gen` antes do build, validação automatizada em CI | Qualquer PR com SDK defasado falha na CI |
| **P1** | Front não espera Back | MSW com `VITE_API_MOCK=1`, handlers gerados do OpenAPI, fixtures por feature | App carrega sem API e navega em fluxo principal |
| **P1** | CI básico e rápido | Pipeline com lint, typecheck, tests e build em paralelo | PR sem regressão passa em < 10 min |
| **P2** | UI guiada por schema | `<AutoForm>` com Zod + RHF, usado em 1 feature | Form simples gerado sem HTML manual |
| **P3** | Doc viva + decisões | Storybook inicial + `ADR.md` com template | Componentes base documentados e primeira ADR criada |

## 🔧 Melhorias Detalhadas (O que realmente mudar)

- **make:crud**: criar `tools/stubs/` com templates (Laravel + React), prompt interativo para campos e tipos, gera CRUD completo e já registra rota e policy.
- **Contrato**: script para inserir endpoints CRUD no OpenAPI e rodar `pnpm sdk:gen` automaticamente no build de produção.
- **MSW**: modo mock por env, fixtures por feature, handlers gerados do OpenAPI para evitar drift.
- **CI**: separar jobs (lint, typecheck, test, build) e cache para pnpm/composer.
- **AutoForm**: mapear Zod -> componentes base, permitir overrides por campo.
- **Storybook**: documentar componentes base e flows críticos (Button, Input, Card, Modal).
- **ADR**: arquivo `ADR.md` com template curto e convenção de nome (`ADR-0001-...`).

---

### Resumo da Filosofia

> **"Se é repetitivo, deve ser automatizado. Se é complexo, deve ser abstraído. Se é regra, deve ser validado por linter."**

---
