# Análise Atual do Módulo de Denúncias - 2024

**Baseado em análise do código fonte atual**  
**Data:** 2024  
**Arquivos analisados:** Código fonte real (não documentação antiga)

---

## 📊 Estado Atual - O que JÁ ESTÁ IMPLEMENTADO

### ✅ Funcionalidades Completas

#### 1. **Wizard de 4 Etapas** ✅
- **StepCategory**: Seleção de categoria com grid, dicas por categoria, animações
- **StepLocation**: GPS, busca de endereço, mapa Leaflet REAL com pino draggable
- **StepCamera**: Captura de fotos, galeria, compressão, tratamento de erros
- **StepReview**: Revisão completa com edição por seção, validação

**Arquivos:**
- `apps/web/src/pages/ReportWizardPage.tsx`
- `apps/web/src/components/report/Step*.tsx`

#### 2. **Mapa Real com Leaflet** ✅
- **IMPLEMENTADO**: `LocationMap.tsx` usa Leaflet com:
  - Pino draggable funcional
  - Click no mapa para mover pino
  - Reverse geocode em `dragend` e `click`
  - Botão "Centralizar no GPS"
  - Fallback offline (mostra placeholder sem tiles)
  - Modo read-only para visualização

**Arquivos:**
- `apps/web/src/components/report/LocationMap.tsx`
- Dependências: `leaflet@1.9.4`, `react-leaflet@4.2.1` ✅

#### 3. **Draft com IndexedDB e Persistência de Imagens** ✅
- **IMPLEMENTADO**: Sistema completo de IndexedDB:
  - Store separada para imagens (Blob)
  - Persistência automática com debounce (500ms)
  - Recriação de `previewUrl` ao carregar
  - Migração de localStorage para IndexedDB
  - Estados de sync: `draft | queued | sending | sent | failed`

**Arquivos:**
- `apps/web/src/lib/idb/reportDraftDB.ts` (405 linhas, completo)
- `apps/web/src/hooks/useReportDraft.ts`

#### 4. **Camera Não Automática** ✅
- **IMPLEMENTADO**: Camera só inicia quando usuário clica
- Botão "Tirar Foto" sempre visível
- Fallback para galeria
- Tratamento robusto de erros (NotAllowed, NotFound, NotReadable)
- Detecção de HTTPS e disponibilidade de câmera

**Arquivos:**
- `apps/web/src/components/report/StepCamera.tsx` (linha 416: `cameraState.status === 'idle'`)

#### 5. **Status Unificados** ✅
- **Backend**: Enum PHP com 4 status (`recebido`, `em_analise`, `resolvido`, `rejeitado`)
- **Frontend**: TypeScript type alinhado
- **KPIs**: Usam apenas os 4 status oficiais

**Arquivos:**
- `apps/api/app/Domains/Reports/Enums/ReportStatus.php`
- `apps/web/src/types/report.ts` (linha 9)
- `apps/web/src/screens/ReportScreen.tsx` (linha 40-44)

#### 6. **Geocoding com Bias** ✅
- **IMPLEMENTADO**: `StepLocation.tsx` linha 132 passa `biasLat` e `biasLon`
- Autocomplete prioriza resultados próximos
- Debounce de 300ms
- AbortController para cancelar requests anteriores

**Arquivos:**
- `apps/web/src/components/report/StepLocation.tsx` (linha 129-132)

#### 7. **TanStack Query Padronizado** ✅
- Query keys organizadas em `QUERY_KEYS.reports.*`
- Invalidação após criar report
- Cache configurado corretamente

**Arquivos:**
- `apps/web/src/api/config.ts` (linha 222-230)
- `apps/web/src/hooks/useMyReports.ts`

#### 8. **Idempotency Key** ✅
- Frontend envia `X-Idempotency-Key` no header
- Geração automática no draft

**Arquivos:**
- `apps/web/src/services/report.service.ts` (linha 85)
- `apps/web/src/types/report.ts` (linha 178)

---

## 🔍 O que PODE SER MELHORADO

### 🔴 P0 - Crítico (Bugs/Inconsistências)

#### 1. **Validação de Descrição no Backend**
**Problema:**
- `StepReview.tsx` diz "Descrição adicional (opcional)" (linha 201)
- Backend pode exigir descrição (precisa verificar `CreateReportRequest.php`)

**Ação:**
- [ ] Verificar validação em `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`
- [ ] Alinhar copy do frontend com validação real
- [ ] Se backend exige, atualizar label para "Descrição (obrigatória)"

**Arquivos:**
- `apps/web/src/components/report/StepReview.tsx` (linha 201)
- `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`

---

#### 2. **Middleware de Idempotência no Backend**
**Problema:**
- Frontend envia `X-Idempotency-Key` mas não encontrei middleware aplicado
- Pode haver duplicação em caso de retry

**Ação:**
- [ ] Verificar se existe middleware `idempotent` em `apps/api`
- [ ] Aplicar na rota `POST /api/v1/reports`
- [ ] Retornar report existente se key já foi usada

**Arquivos:**
- `apps/api/routes/api.php` (verificar rota de reports)
- Criar/verificar `apps/api/app/Http/Middleware/IdempotentMiddleware.php`

---

### 🟠 P1 - Alto Impacto (Melhorias Importantes)

#### 3. **Outbox com Retry Automático**
**Problema:**
- `reportDraftDB.ts` tem estados de sync mas não há worker de retry
- Fila offline existe mas não processa automaticamente

**Solução:**
```typescript
// Criar: apps/web/src/services/reportSync.service.ts
// - Worker de background para processar fila
// - Retry com backoff exponencial
// - Enviar imagens via /reports/{id}/media após criar report
```

**Ação:**
- [ ] Criar `reportSync.service.ts` com worker de background
- [ ] Implementar retry com backoff (1s, 2s, 4s, 8s...)
- [ ] Processar fila quando voltar online
- [ ] Enviar imagens separadamente se report foi criado sem imagens

**Arquivos:**
- Criar: `apps/web/src/services/reportSync.service.ts`
- `apps/web/src/lib/idb/reportDraftDB.ts` (já tem estrutura)

---

#### 4. **Feedback Visual de Salvamento**
**Problema:**
- Draft salva automaticamente mas usuário não vê feedback
- Não há indicação de "Salvo automaticamente"

**Solução:**
- [ ] Adicionar toast discreto ao salvar draft
- [ ] Mostrar "Salvo automaticamente" por 2s
- [ ] Indicador visual no header do wizard

**Arquivos:**
- `apps/web/src/hooks/useReportDraft.ts` (adicionar toast no `debouncedSave`)

---

#### 5. **Validação de Título no Frontend**
**Problema:**
- `StepReview` valida título mas pode melhorar UX
- Backend pode ter validação diferente

**Ação:**
- [ ] Verificar validação do backend (mínimo de caracteres)
- [ ] Adicionar contador de caracteres no input
- [ ] Mostrar erro inline se inválido

**Arquivos:**
- `apps/web/src/components/report/StepReview.tsx` (linha 83-89)
- `apps/api/app/Domains/Reports/Http/Requests/CreateReportRequest.php`

---

#### 6. **Melhorar Tratamento de Erros no Envio**
**Problema:**
- Erros de rede podem não ser tratados adequadamente
- Não há retry automático em caso de falha temporária

**Ação:**
- [ ] Adicionar retry automático para erros 5xx
- [ ] Mover para fila offline em caso de erro de rede
- [ ] Mostrar mensagem clara ao usuário

**Arquivos:**
- `apps/web/src/pages/ReportWizardPage.tsx` (linha 89-141)
- `apps/web/src/services/report.service.ts`

---

### 🟡 P2 - Médio Impacto (Melhorias de UX)

#### 7. **Preview de Imagens no StepReview**
**Problema:**
- Imagens aparecem pequenas (20x20) no review
- Poderia ter preview maior ou galeria

**Ação:**
- [ ] Aumentar tamanho das thumbnails (ex: 80x80)
- [ ] Adicionar click para ver em tamanho maior
- [ ] Mostrar ordem das imagens

**Arquivos:**
- `apps/web/src/components/report/StepReview.tsx` (linha 178-188)

---

#### 8. **Feedback de Compressão de Imagem**
**Problema:**
- Compressão acontece mas feedback só aparece em alguns casos
- Usuário não sabe se imagem foi otimizada

**Ação:**
- [ ] Sempre mostrar feedback de compressão
- [ ] Indicar tamanho antes/depois
- [ ] Toast discreto: "Imagem otimizada: 8.2MB → 1.1MB"

**Arquivos:**
- `apps/web/src/components/report/StepCamera.tsx` (linha 336-342)

---

#### 9. **Melhorar Mensagens de Erro de Localização**
**Problema:**
- Mensagens de erro podem ser mais claras
- Falta instrução passo-a-passo em alguns casos

**Ação:**
- [ ] Melhorar copy das mensagens de erro
- [ ] Adicionar screenshots ou ilustrações
- [ ] Link para configurações do navegador (se possível)

**Arquivos:**
- `apps/web/src/components/report/StepLocation.tsx` (linha 252-352)

---

#### 10. **Adicionar Loading States Melhores**
**Problema:**
- Alguns estados de loading podem ser mais informativos
- Falta skeleton em alguns lugares

**Ação:**
- [ ] Adicionar skeleton no `ReportDetailPage` (já tem, verificar)
- [ ] Melhorar loading do `StepCategory`
- [ ] Adicionar progresso no upload de imagens

**Arquivos:**
- `apps/web/src/pages/ReportDetailPage.tsx` (já tem LoadingSkeleton)
- `apps/web/src/components/report/StepCategory.tsx` (linha 40-46)

---

### 🟢 P3 - Baixo Impacto (Melhorias Futuras)

#### 11. **Compartilhamento de Protocolo**
**Problema:**
- Protocolo pode ser compartilhado mas UX pode melhorar
- Falta botão de compartilhar na tela de sucesso

**Ação:**
- [ ] Adicionar botão de compartilhar no `ReportSuccess`
- [ ] Usar Web Share API quando disponível
- [ ] Copiar link automaticamente

**Arquivos:**
- `apps/web/src/components/report/ReportSuccess.tsx`

---

#### 12. **Notificações de Mudança de Status**
**Problema:**
- Usuário não é notificado quando status muda
- Precisa abrir app para ver atualizações

**Ação:**
- [ ] Implementar notificações push (PWA)
- [ ] Notificação in-app quando status muda
- [ ] Badge no ícone do app

**Arquivos:**
- Criar: `apps/web/src/services/notifications.service.ts`

---

#### 13. **Adicionar Informações ao Report**
**Problema:**
- Usuário não pode adicionar fotos/notas após enviar
- Falta funcionalidade de "complementar denúncia"

**Ação:**
- [ ] Botão "Adicionar informação" no `ReportDetailPage`
- [ ] Permitir adicionar fotos via `/reports/{id}/media`
- [ ] Permitir adicionar nota/comentário

**Arquivos:**
- `apps/web/src/pages/ReportDetailPage.tsx`
- `apps/web/src/services/report.service.ts` (já tem `addReportMedia`)

---

## 📋 Checklist de Verificação

### Backend
- [ ] Verificar validação de `description` em `CreateReportRequest.php`
- [ ] Verificar se middleware `idempotent` está aplicado em `POST /reports`
- [ ] Verificar validação de `title` (mínimo de caracteres)
- [ ] Verificar se `X-Idempotency-Key` é processado

### Frontend
- [ ] Verificar se copy de "Descrição opcional" está correto
- [ ] Testar persistência de imagens após recarregar página
- [ ] Testar mapa offline (desconectar internet)
- [ ] Testar envio offline (mover para fila)
- [ ] Verificar se retry automático funciona

### UX
- [ ] Testar fluxo completo do wizard
- [ ] Verificar mensagens de erro
- [ ] Testar em diferentes dispositivos (iOS, Android, Desktop)
- [ ] Verificar acessibilidade (screen readers)

---

## 🎯 Priorização Recomendada

### Sprint 1 (1 semana)
1. ✅ Verificar validação de descrição (P0)
2. ✅ Aplicar middleware de idempotência (P0)
3. ✅ Implementar outbox com retry (P1)
4. ✅ Adicionar feedback de salvamento (P1)

### Sprint 2 (1 semana)
5. ✅ Melhorar validação de título (P1)
6. ✅ Melhorar tratamento de erros (P1)
7. ✅ Melhorar preview de imagens (P2)
8. ✅ Feedback de compressão (P2)

### Backlog
9. Melhorar mensagens de erro (P2)
10. Notificações de status (P3)
11. Adicionar informações ao report (P3)

---

## 📊 Métricas de Qualidade Atual

### ✅ Pontos Fortes
- **Código bem estruturado**: Separação clara de responsabilidades
- **TypeScript**: Tipagem forte em todo o código
- **IndexedDB**: Implementação robusta com migração
- **Leaflet**: Mapa real funcional (não placeholder)
- **Offline-first**: Suporte a modo offline
- **Error handling**: Tratamento de erros em vários pontos

### ⚠️ Pontos de Atenção
- **Retry automático**: Não implementado (fila existe mas não processa)
- **Validações**: Pode haver inconsistência frontend/backend
- **Feedback visual**: Alguns salvamentos são silenciosos
- **Idempotência**: Frontend envia mas backend pode não processar

---

## 🔧 Arquivos Principais

### Frontend
```
apps/web/src/
├── pages/
│   ├── ReportWizardPage.tsx          # Wizard principal
│   ├── ReportDetailPage.tsx          # Detalhes público
│   ├── MyReportsPage.tsx             # Lista do usuário
│   └── ReportScreen.tsx               # Lista pública
├── components/report/
│   ├── StepCategory.tsx              # Etapa 1
│   ├── StepLocation.tsx              # Etapa 2
│   ├── StepCamera.tsx                # Etapa 3
│   ├── StepReview.tsx                # Etapa 4
│   ├── LocationMap.tsx               # Mapa Leaflet
│   └── ReportSuccess.tsx             # Tela de sucesso
├── hooks/
│   ├── useReportDraft.ts            # Hook do draft
│   └── useMyReports.ts               # Hook de reports
├── services/
│   └── report.service.ts             # Service de API
└── lib/idb/
    └── reportDraftDB.ts              # IndexedDB wrapper
```

### Backend
```
apps/api/app/
├── Domains/Reports/
│   ├── Models/
│   │   └── CitizenReport.php        # Model principal
│   ├── Enums/
│   │   └── ReportStatus.php         # Enum de status
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── ReportController.php  # Controller
│   │   └── Requests/
│   │       └── CreateReportRequest.php # Validação
│   └── Http/Resources/
│       └── ReportResource.php        # Resource (API response)
└── routes/
    └── api.php                        # Rotas
```

---

## 📝 Notas Técnicas

### Stack Confirmada
- **Frontend**: React 18, TypeScript, Vite, Tailwind, Framer Motion
- **Mapas**: Leaflet 1.9.4, react-leaflet 4.2.1 ✅
- **Storage**: IndexedDB via `idb` 8.0.3 ✅
- **State**: TanStack Query 5.83.0, Zustand 5.0.10
- **Backend**: Laravel 12, PHP 8.2+
- **Database**: MariaDB

### Dependências Instaladas
```json
{
  "leaflet": "^1.9.4",
  "react-leaflet": "^4.2.1",
  "@types/leaflet": "^1.9.21",
  "idb": "^8.0.3"
}
```

---

## ✅ Conclusão

O módulo de denúncias está **muito bem implementado**. A maioria das funcionalidades mencionadas em análises antigas **já está implementada**:

- ✅ Mapa real com Leaflet
- ✅ Draft com IndexedDB e imagens
- ✅ Camera não automática
- ✅ Status unificados
- ✅ Geocoding com bias
- ✅ TanStack Query padronizado

**Principais melhorias necessárias:**
1. Verificar validações backend/frontend
2. Implementar retry automático da fila offline
3. Melhorar feedback visual
4. Aplicar middleware de idempotência

**Prioridade:** Focar em melhorias de UX e robustez, não em features novas.

---

**Última atualização:** 2024  
**Próxima revisão:** Após implementação das melhorias P0 e P1
