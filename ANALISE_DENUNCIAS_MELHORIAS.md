# Análise do Módulo de Denúncias - Sugestões de Melhorias

**Data da Análise:** 2024  
**Versão do Sistema:** Atual  
**Analista:** AI Assistant

---

## 📋 Resumo Executivo

Este documento apresenta uma análise completa do módulo de **Denúncias Cidadãs (Fiscaliza Tijucas)** e sugere melhorias priorizadas para aumentar a qualidade, usabilidade e confiabilidade do sistema.

### Estado Atual
- ✅ Wizard funcional em 4 etapas (Categoria, Localização, Fotos, Revisão)
- ✅ Sistema de rascunho com IndexedDB
- ✅ Upload de imagens com compressão
- ✅ Geocoding via proxy backend
- ✅ Offline sync básico
- ✅ Painel administrativo (Filament)

### Principais Gaps Identificados
1. **Inconsistências de Status** - Frontend e backend usam status diferentes
2. **Mapa Placeholder** - Não há mapa real interativo
3. **Camera Auto-start** - Pode causar negação de permissão
4. **Draft sem Imagens** - Imagens não persistem no rascunho
5. **OpenAPI Desatualizado** - Paths e schemas não batem com implementação

---

## 🔴 P0 - Crítico (Correções Urgentes)

### 1. Unificação de Status

**Problema:**
- Backend usa: `recebido`, `em_analise`, `resolvido`, `rejeitado`
- Frontend/KPIs podem usar: `em_andamento`, `nao_procede` (não existem no backend)
- Inconsistência causa bugs invisíveis e confusão

**Solução:**
```typescript
// apps/web/src/types/report.ts
export type ReportStatus = 'recebido' | 'em_analise' | 'resolvido' | 'rejeitado';
```

**Ações:**
- [ ] Remover qualquer referência a `em_andamento` e `nao_procede` no frontend
- [ ] Atualizar `ReportScreen.tsx` para usar apenas status oficiais
- [ ] Atualizar KPIs em `useReportsStats` para refletir status corretos
- [ ] Validar que backend retorna apenas os 4 status oficiais

**Arquivos Afetados:**
- `apps/web/src/types/report.ts`
- `apps/web/src/screens/ReportScreen.tsx`
- `apps/web/src/services/report.service.ts` (interface `ReportsStats`)
- `apps/web/src/hooks/useMyReports.ts`

---

### 2. Alinhamento OpenAPI

**Problema:**
- OpenAPI pode ter paths desatualizados
- Frontend usa `/reports/me` mas OpenAPI pode ter `/users/me/reports`
- Schema de `POST /reports` pode estar como JSON com base64, mas backend recebe multipart

**Solução:**
- [ ] Verificar `contracts/openapi.yaml` e alinhar com `apps/web/src/api/config.ts`
- [ ] Atualizar OpenAPI para `multipart/form-data` no `POST /reports`
- [ ] Garantir que campos usam `camelCase` (categoryId, bairroId) conforme backend
- [ ] Rodar script de validação: `tools/contract-check/check-endpoints.mjs`

**Arquivos Afetados:**
- `contracts/openapi.yaml`
- `apps/web/src/mocks/handlers.generated.ts` (se houver mock de `/users/me/reports`)

---

### 3. Validação de Descrição

**Problema:**
- `StepReview` diz "descrição opcional"
- Backend exige `description` com mínimo 10 caracteres
- Usuário pode tentar enviar sem descrição e receber erro

**Solução:**
- [ ] Opção A: Atualizar copy do `StepReview` para "Descrição obrigatória (mín. 10 caracteres)"
- [ ] Opção B: Relaxar validação do backend para aceitar descrição vazia ou null
- [ ] Adicionar validação no frontend antes do envio

**Arquivos Afetados:**
- `apps/web/src/components/report/StepReview.tsx`
- `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`

---

## 🟠 P1 - Alto Impacto (Melhorias Importantes)

### 4. Mapa Real Interativo

**Problema:**
- `StepLocation` usa componente `LocationMap` que parece ser placeholder
- Não há pino draggable real
- Usuário não pode ajustar localização visualmente

**Solução:**
Implementar mapa real com Leaflet:

```typescript
// Instalar dependências
// npm install leaflet react-leaflet
// npm install -D @types/leaflet

// apps/web/src/components/report/LocationMap.tsx
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
```

**Funcionalidades:**
- [ ] Mapa com tiles do OpenStreetMap ou MapTiler
- [ ] Pino draggable que atualiza coordenadas
- [ ] Click no mapa move o pino
- [ ] Reverse geocode apenas em `dragend` e `click` (debounce 300-500ms)
- [ ] Botão "Centralizar no GPS"
- [ ] Salvar zoom no draft
- [ ] Autocomplete move o pino e faz `map.flyTo()`

**Arquivos Afetados:**
- `apps/web/src/components/report/LocationMap.tsx` (reescrever)
- `apps/web/src/components/report/StepLocation.tsx` (integrar mapa real)
- `apps/web/package.json` (adicionar dependências)

**Offline:**
- [ ] Detectar online/offline
- [ ] Se offline, não carregar tiles (mostrar placeholder)
- [ ] Permitir apenas GPS e endereço manual quando offline

---

### 5. Camera Não Automática

**Problema:**
- Camera inicia automaticamente no mount do `StepCamera`
- Pode causar negação de permissão imediata
- Usuário não tem controle sobre quando ativar

**Solução:**
✅ **JÁ IMPLEMENTADO** - O código atual já não inicia automaticamente!

**Verificação:**
- [ ] Confirmar que `StepCamera` não chama `startCamera()` no `useEffect`
- [ ] Garantir que botão "Ativar camera" está sempre visível
- [ ] Testar em diferentes dispositivos (iOS, Android, Desktop)

**Melhorias Adicionais:**
- [ ] Detectar `window.isSecureContext` e avisar se não for HTTPS
- [ ] Usar `enumerateDevices()` para verificar se há câmera antes de mostrar botão
- [ ] Fallback imediato para file input em caso de erro

---

### 6. Persistência de Imagens no Draft

**Problema:**
- Draft salva em IndexedDB mas imagens são perdidas
- `CapturedImage` tem `previewUrl` (objectURL) que expira
- Ao recarregar, imagens não aparecem

**Solução:**
```typescript
// apps/web/src/lib/idb/reportDraftDB.ts
interface DraftImage {
    id: string;
    blob: Blob;  // Salvar Blob diretamente
    capturedAt: string;
}

// Ao salvar:
const imageBlob = await image.file.arrayBuffer();
await idb.set(`draft-image-${image.id}`, new Blob([imageBlob]));

// Ao carregar:
const blob = await idb.get(`draft-image-${image.id}`);
const previewUrl = URL.createObjectURL(blob);
```

**Ações:**
- [ ] Criar store dedicada para imagens do draft em IndexedDB
- [ ] Salvar Blob de cada imagem com chave única
- [ ] Ao carregar draft, recriar `previewUrl` dos Blobs
- [ ] Limpar Blobs antigos ao limpar draft

**Arquivos Afetados:**
- `apps/web/src/hooks/useReportDraft.ts`
- `apps/web/src/lib/idb/reportDraftDB.ts` (criar)

---

### 7. Outbox com Estados Formais

**Problema:**
- `syncQueueDB` existe mas não tem estados formais
- Não há retry automático com backoff
- Falhas não são rastreadas adequadamente

**Solução:**
```typescript
type OutboxState = 'draft' | 'queued' | 'sending' | 'sent' | 'failed';

interface OutboxItem {
    id: string;
    type: 'report';
    state: OutboxState;
    data: CreateReportPayload;
    images: Blob[];  // Salvar Blobs para envio posterior
    idempotencyKey: string;
    attempts: number;
    lastError?: string;
    retryAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
```

**Funcionalidades:**
- [ ] Estados formais com transições válidas
- [ ] Retry automático com backoff exponencial (1s, 2s, 4s, 8s...)
- [ ] Enviar imagens via `/reports/{id}/media` após criar report
- [ ] Marcar `failed` em erros 4xx (sem retry)
- [ ] Worker de background para processar fila

**Arquivos Afetados:**
- `apps/web/src/lib/localDatabase.ts` (evoluir `syncQueueDB`)
- `apps/web/src/services/reportSync.service.ts` (criar)

---

### 8. Geocoding com Bias

**Problema:**
- Autocomplete não envia lat/lon quando disponível
- Sugestões podem ser de lugares distantes
- Não prioriza resultados próximos

**Solução:**
✅ **JÁ IMPLEMENTADO PARCIALMENTE** - `StepLocation.tsx` linha 132 já passa bias!

**Melhorias:**
- [ ] Garantir que bias é sempre enviado quando `draft.location` existe
- [ ] Backend: cache por query + lat/lon arredondado (ex: 0.01 graus)
- [ ] Fallback gracioso se Nominatim falhar (não bloquear wizard)

**Arquivos Afetados:**
- `apps/web/src/components/report/StepLocation.tsx` (verificar implementação)
- `apps/api/app/Domains/Geocoding/Http/Controllers/GeocodeController.php` (melhorar cache)

---

## 🟡 P2 - Médio Impacto (Melhorias de UX)

### 9. Privacidade e Visibilidade Pública

**Problema:**
- Endpoint público `/reports` pode expor dados sensíveis
- Não há controle de visibilidade (public/private)

**Solução:**
- [ ] Confirmar que `ReportResource` não retorna `user_id` no público
- [ ] Adicionar campo `is_public` ou `visibility` no modelo
- [ ] Garantir que apenas denúncias aprovadas aparecem em `/reports`
- [ ] Documentar regra de publicação no OpenAPI

**Arquivos Afetados:**
- `apps/api/app/Domains/Reports/Http/Resources/ReportResource.php`
- `apps/api/app/Domains/Reports/Models/CitizenReport.php`
- `DENUNCIAS_SPEC.md`

---

### 10. TanStack Query - Padronização

**Problema:**
- Query keys podem estar inconsistentes
- Cache não é invalidado após criar report

**Solução:**
```typescript
// apps/web/src/api/config.ts - JÁ TEM ESTRUTURA CORRETA
export const QUERY_KEYS = {
    reports: {
        all: ['reports'] as const,
        list: (filters?) => ['reports', 'list', filters] as const,
        mine: ['reports', 'mine'] as const,
        public: ['reports', 'public'] as const,
        stats: () => ['reports', 'stats'] as const,
        detail: (id: string) => ['reports', 'detail', id] as const,
        categories: ['reports', 'categories'] as const,
    },
};
```

**Ações:**
- [ ] Usar apenas essas keys em todos os hooks
- [ ] Invalidar `mine` e `stats` após criar report
- [ ] Invalidar `public` e `stats` após admin atualizar status

**Arquivos Afetados:**
- `apps/web/src/hooks/useMyReports.ts`
- `apps/web/src/pages/ReportWizardPage.tsx` (invalidar após submit)

---

### 11. Idempotency Middleware

**Problema:**
- Middleware `idempotent` existe mas pode não estar aplicado
- Duplicação de reports em caso de retry

**Solução:**
- [ ] Aplicar middleware `idempotent` na rota `POST /reports`
- [ ] Garantir que `X-Idempotency-Key` é validado
- [ ] Retornar report existente se key já foi usada

**Arquivos Afetados:**
- `apps/api/routes/api.php`
- `apps/api/app/Http/Middleware/IdempotentMiddleware.php` (se existir)

---

### 12. Feedback Visual e Microinterações

**Melhorias de UX:**
- [ ] Mostrar "Salvo automaticamente" ao salvar draft
- [ ] Feedback de compressão de imagem (ex: "8.2MB → 1.1MB")
- [ ] Progresso visual no wizard (já existe, melhorar)
- [ ] Animações suaves entre steps
- [ ] Toast de sucesso com protocolo copiável

**Arquivos Afetados:**
- `apps/web/src/components/report/StepCamera.tsx` (feedback de compressão)
- `apps/web/src/components/report/ReportSuccess.tsx` (melhorar)

---

## 🟢 P3 - Baixo Impacto (Melhorias Futuras)

### 13. Pós-Envio - Engajamento

**Funcionalidades:**
- [ ] Tela de sucesso com timeline do status
- [ ] Notificação in-app quando status muda
- [ ] Botão "Adicionar informação" no detalhe (nota/foto)
- [ ] Compartilhamento de protocolo via link

---

### 14. Categorias - UX Melhorada

**Melhorias:**
- [ ] Grid principal com categorias mais usadas
- [ ] "Ver todas" para lista completa
- [ ] Categorias recentes no topo
- [ ] Busca de categorias

---

### 15. Localização - 3 Cards Fixos

**Melhorias:**
- [ ] Sempre mostrar 3 opções: GPS, Buscar, Mapa
- [ ] Cards sempre visíveis (não em sheet)
- [ ] Feedback imediato: "Localização atualizada"

---

### 16. Revisão - Edição por Seção

**Melhorias:**
- [ ] Botão "Editar" em cada seção
- [ ] Voltar para step específico
- [ ] Preview de imagens maior

---

## 📊 Priorização Recomendada

### Sprint 1 (1-2 semanas)
1. ✅ Unificar status (P0)
2. ✅ Alinhar OpenAPI (P0)
3. ✅ Corrigir validação de descrição (P0)
4. ✅ Mapa real com Leaflet (P1)

### Sprint 2 (2-3 semanas)
5. ✅ Persistir imagens no draft (P1)
6. ✅ Outbox com estados formais (P1)
7. ✅ Melhorar geocoding com bias (P1)
8. ✅ Padronizar TanStack Query (P2)

### Sprint 3 (1-2 semanas)
9. ✅ Privacidade e visibilidade (P2)
10. ✅ Idempotency middleware (P2)
11. ✅ Feedback visual (P2)

### Backlog
12. Pós-envio e engajamento (P3)
13. Melhorias de UX em categorias/localização (P3)

---

## 🧪 Testes Recomendados

### Testes Manuais
- [ ] StepLocation: GPS permitido/negado, drag/click, autocomplete bias, offline
- [ ] StepCamera: HTTPS vs HTTP, sem câmera, permissões negadas, limite 3 imagens
- [ ] Offline sync: criar denúncia offline e sincronizar ao voltar online
- [ ] KPIs e filtros apenas com status oficial
- [ ] Draft persiste imagens após recarregar página

### Testes Automatizados
- [ ] Teste de criação de report com multipart
- [ ] Teste de idempotency key
- [ ] Teste de validação de status
- [ ] Teste de geocoding com bias

---

## 📝 Notas Técnicas

### Stack Atual
- **Frontend:** React + Vite PWA, TypeScript, Tailwind, Framer Motion, TanStack Query, IndexedDB
- **Backend:** Laravel 12, MariaDB, Sanctum, Spatie Media Library
- **Geocoding:** Proxy backend com Nominatim, cache 30min
- **Mapas:** Leaflet (a ser implementado)

### Dependências Novas
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.8"
}
```

### Configuração Leaflet CSS
```typescript
// apps/web/src/main.tsx ou App.tsx
import 'leaflet/dist/leaflet.css';
```

---

## ✅ Checklist de Implementação

### P0 - Crítico
- [ ] Unificar enum de status no frontend
- [ ] Remover `em_andamento` e `nao_procede` de KPIs
- [ ] Atualizar OpenAPI para `/reports/me` e multipart
- [ ] Corrigir validação/copy de descrição

### P1 - Alto Impacto
- [ ] Instalar Leaflet e react-leaflet
- [ ] Implementar mapa real com pino draggable
- [ ] Persistir imagens no draft (IndexedDB com Blob)
- [ ] Implementar outbox com estados formais
- [ ] Melhorar geocoding com bias (verificar implementação atual)

### P2 - Médio Impacto
- [ ] Padronizar TanStack Query keys
- [ ] Aplicar idempotency middleware
- [ ] Melhorar privacidade no endpoint público
- [ ] Adicionar feedback visual

---

## 📚 Referências

- Documentação existente:
  - `DENUNCIAS_ANALISE.md` - Análise anterior
  - `DENUNCIAS_SPEC.md` - Especificação
  - `denuncias.md` - Checklist de implementação

- Arquivos principais:
  - `apps/web/src/pages/ReportWizardPage.tsx`
  - `apps/web/src/components/report/Step*.tsx`
  - `apps/api/app/Domains/Reports/Http/Controllers/ReportController.php`
  - `apps/api/app/Domains/Reports/Models/CitizenReport.php`

---

**Última Atualização:** 2024  
**Próxima Revisão:** Após implementação das melhorias P0 e P1
