# Análise Técnica Detalhada: Módulo de Denúncias ("Fiscaliza")

**Data da Análise:** 09/02/2026
**Versão do App:** 1.0.0 (Baseado no código fonte atual)

---

## 1. Visão Geral
O módulo de denúncias (referenciado visualmente como "**Fiscaliza [NomeCidade]**") é um sistema completo de zeladoria urbana que permite aos cidadãos reportarem problemas (buracos, iluminação, lixo, etc.). O sistema é **multi-tenant**, **offline-first** e **mobile-first**.

---

## 2. Componentes da Home ("Box Fiscaliza")

O "box" na home é o ponto de entrada principal, projetado para engajamento e feedback rápido.

**Arquivos Principais:**
- `apps/web/src/components/home/FiscalizaVivo.tsx`: Componente principal do card interativo.
- `apps/web/src/components/home/FiscalizaMiniMap.tsx`: Componente visual do mini-mapa estático.

### 2.1. Textos e Termos (Verificado em Código)
- **Título**: "Fiscaliza [NomeCidade]" (Dinâmico via `useCityName`).
- **Subtítulo**: "Denúncias dos cidadãos".
- **KPIs (Indicadores)**:
  - **Total**: Número total de denúncias da cidade.
  - **Resolvidos**: Denúncias com status `resolvido`.
  - **Hoje**: Novas denúncias nas últimas 24h (Exibido como `+N`).
  - **Taxa de Resolução**: Barra de progresso calculada: `(resolvidos / total) * 100`.
- **Frases de Engajamento** (Rotacionam a cada 4s):
  1. "🔧 Sua denúncia faz a diferença!"
  2. "📍 Viu algo? Registre agora."
  3. "🏆 Cidadãos resolvendo juntos."
  4. "⚡ Tempo médio de resposta: 48h"

### 2.2. Lógica de Funcionamento Detalhada
1.  **Inicialização**:
    - Exibe `FiscalizaSkeleton` durante o carregamento dos dados (`isLoading`).
    - O Mini-mapa tem um *delay proposital de 500ms* (`setTimeout`) para não bloquear a renderização inicial da Home.
2.  **Payload de Dados (`FiscalizaVivoPayload`)**:
    - Recebe `total`, `resolvidos`, `hoje`, `frases` (opcional, fallback para padrão) e `recent_reports`.
3.  **Mini Mapa Visual (`FiscalizaMiniMap.tsx`)**:
    - **Não é um mapa real**: Para performance, usa um background CSS com gradiente e um padrão SVG (`pattern id="grid"`).
    - **Posicionamento dos Pinos**: Usa valores de porcentagem pré-definidos (`top/left`) para espalhar visualmente até 3 pinos recentes, evitando sobreposição real geográfica bugada em espaço pequeno.
    - **Animação**: Pinos com status diferente de 'resolvido' possuem um anel pulsante (`animate={{ scale: [1, 1.5, 1], opacity: [0.6, 0, 0.6] }}`).
4.  **Interação e Haptic Feedback**:
    - Uso do hook `useHaptic` para feedback tátil:
        - Clique no card: `haptic.trigger('light')`.
        - Botão "Fazer denúncia": `haptic.trigger('medium')`.
    - **Roteamento Inteligente**:
        - Se logado (`isAuthenticated`): Vai direto para o Wizard (`/denuncia/nova`).
        - Se anônimo: Vai para a tela de login/listagem (`/denuncias`).

---

## 3. Fluxo de Nova Denúncia (Wizard)

O processo de criação é orquestrado pelo componente `ReportWizardPage`, garantindo persistência e experiência fluida.

**Arquivo Principal:** `apps/web/src/pages/ReportWizardPage.tsx`
**Gerenciamento de Estado:** `useReportDraft` (Persistência em IndexedDB).

### 3.1. Etapas do Wizard (Steps)
1.  **Categoria (`StepCategory.tsx`)**
    - Grid de ícones.
    - Validação: `!draft.categoryId` impede avanço.

2.  **Localização (`StepLocation.tsx`)**
    - **GPS**: Botão "Usar minha localização" aciona `navigator.geolocation`.
    - **Mapa**: Componente `LocationMap` (Leaflet) permite ajuste fino do pino.
    - **Dados Salvos**: `latitude`, `longitude`, `address` (via reverse geoding), `accuracy` (precisão em metros), `source` ('gps', 'manual', 'map').

3.  **Fotos (`StepCamera.tsx`)**
    - Lógica de captura nativa.
    - **Compressão**: Imagens são redimensionadas e comprimidas no client antes do upload/armazenamento no draft para economizar dados e espaço local.

4.  **Revisão (`StepReview.tsx`)**
    - Validação Final no `handleSubmit`:
        - Categoria obrigatória.
        - Título: Obrigatório, **mínimo 5 caracteres**.
        - Descrição: Opcional.

### 3.2. Lógica de Envio e Robustez Offline
- **Idempotência**:
    - Uma `idempotencyKey` é gerada no início do draft.
    - É enviada no header ou payload para evitar duplicidade em retentativas de rede.
- **Tratamento de Erro Offline**:
    - Função `isOfflineLikeReportError(error)` detecta falhas de conexão.
    - **Fallback**:
        1. Salva o estado atual no `ReportDraftDB`.
        2. Enfileira o ID do draft na "Outbox" (`enqueueReportDraft(ACTIVE_REPORT_DRAFT_STORAGE_ID)`).
        3. Notifica o usuário: "Denúncia salva offline. Vamos enviar quando a conexão voltar."
        4. Redireciona para "Minhas Denúncias" onde o item ficará como "Aguardando sincronização".

---

## 4. O Mapa ("Fiscaliza Map")

Visualização geoespacial completa com filtros avançados.

**Arquivo Principal:** `apps/web/src/screens/ReportsMapScreen.tsx`

### 4.1. Funcionalidades Verificadas
- **Clusterização Visual**: Renderiza pinos reais no mapa.
- **Filtros**:
    - Estado do React (`statusFilter`, `categoryFilter`, `periodFilter`).
    - `useQuery` dispara novas requisições ao mover o mapa (alteração de `bbox`), trazendo apenas denúncias da área visível.
- **Drawer de Detalhes**:
    - Ao clicar num pino, abre um Drawer inferior com resumo.
    - Botão "Rotas" abre link externo para Google Maps: `https://www.google.com/maps/dir/?api=1&destination=LAT,LON`.

---

## 5. Multi-Tenancy (Multi-Cidades)

O sistema garante isolamento de dados entre cidades.

**Arquivos de Verificação:** `apps/web/src/api/client.ts` e `apps/web/src/store/useTenantStore.ts`.

**Mecanismo Confirmado:**
1.  **Interceptação**: O `apiClient` possui um interceptor (ou função helper `getTenantHeaders`) que injeta `X-City: [slug]` em **toda** requisição.
2.  **Contexto**: O hook `useCityName` e a store `useTenantStore` mantêm o estado da cidade atual, recuperado da URL ou do LocalStorage.

---

## 6. Arquivos Chave para Manutenção

| Componente | Arquivo | Status |
| :--- | :--- | :--- |
| **Home Box** | `apps/web/src/components/home/FiscalizaVivo.tsx` | ✅ Verificado |
| **Mini Mapa** | `apps/web/src/components/home/FiscalizaMiniMap.tsx` | ✅ Verificado |
| **Wizard** | `apps/web/src/pages/ReportWizardPage.tsx` | ✅ Verificado |
| **Mapa (Tela)** | `apps/web/src/screens/ReportsMapScreen.tsx` | ✅ Verificado |
| **Serviço** | `apps/web/src/services/report.service.ts` | ✅ Verificado |
