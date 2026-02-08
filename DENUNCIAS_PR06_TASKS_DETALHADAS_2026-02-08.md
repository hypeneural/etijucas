# PR-06 Tasks Detalhadas - UX Mapa Premium

Data: 2026-02-08
Escopo: `apps/web`
Status geral: `EM_VALIDACAO_MANUAL`

---

## Objetivo do PR-06

Elevar a experiencia do step de localizacao no wizard de denuncias para um fluxo mais nativo e resiliente:

- skeleton no carregamento do mapa/tiles;
- CTA flutuante "Confirmar local" no mapa;
- feedback haptico em ajuste/confirmacao;
- fallback explicito "Enviar mesmo assim" quando reverse geocode falha;
- manter continuidade do fluxo sem bloqueio por erro parcial.

---

## Task Board (com IDs)

### `PR06-T001` - Skeleton de mapa e estado de tiles
Status: `DONE`
Objetivo: evitar percepcao de tela branca no carregamento inicial.

Subtarefas:
- `PR06-T001.1` Criar componente visual dedicado de loading de mapa.
  - Arquivo: `apps/web/src/components/report/MapSkeleton.tsx`
- `PR06-T001.2` Integrar `MapSkeleton` no `LocationMap` enquanto mapa/tiles nao estao prontos.
- `PR06-T001.3` Exibir aviso de falha parcial em `tileerror` sem bloquear interacao.
  - Arquivo: `apps/web/src/components/report/LocationMap.tsx`

Resultado:
- Mapa carrega com skeleton consistente e sem flash branco na primeira renderizacao.

---

### `PR06-T002` - CTA flutuante "Confirmar local"
Status: `DONE`
Objetivo: deixar acao principal clara diretamente sobre o mapa.

Subtarefas:
- `PR06-T002.1` Adicionar prop `onConfirmLocation` em `LocationMap`.
- `PR06-T002.2` Renderizar botao flutuante "Confirmar local" quando nao estiver em `readOnly`.
- `PR06-T002.3` Integrar callback no `StepLocation` para avancar ao proximo passo.
  - Arquivos:
    - `apps/web/src/components/report/LocationMap.tsx`
    - `apps/web/src/components/report/StepLocation.tsx`

Resultado:
- Usuario consegue confirmar local diretamente no mapa sem depender so do rodape.

---

### `PR06-T003` - Feedback haptico no fluxo de localizacao
Status: `DONE`
Objetivo: adicionar percepcao tatil em interacoes chave.

Subtarefas:
- `PR06-T003.1` Disparar haptico de selecao ao clicar/arrastar pino no mapa.
- `PR06-T003.2` Disparar haptico de sucesso em confirmacao de local.
- `PR06-T003.3` Disparar haptico de warning em falha de geolocalizacao.
  - Arquivos:
    - `apps/web/src/components/report/LocationMap.tsx`
    - `apps/web/src/components/report/StepLocation.tsx`

Resultado:
- Interacoes de mapa e confirmacao ficaram com feedback mais "native feel".

---

### `PR06-T004` - Fallback "Enviar mesmo assim" (erro parcial)
Status: `DONE`
Objetivo: evitar bloqueio do usuario quando reverse geocode falhar.

Subtarefas:
- `PR06-T004.1` Rastrear estado de falha de reverse geocode (`reverseGeocodeFailed`).
- `PR06-T004.2` Exibir card de aviso nao-bloqueante com CTA "Enviar mesmo assim".
- `PR06-T004.3` Ajustar CTA principal do rodape para manter continuidade em erro parcial.
  - Arquivo: `apps/web/src/components/report/StepLocation.tsx`

Resultado:
- Falha de endereco nao interrompe fluxo; usuario segue com coordenadas.

---

### `PR06-T005` - Validacao tecnica (lint/test/build)
Status: `DONE`
Objetivo: garantir robustez de build e higiene do escopo alterado.

Subtarefas:
- `PR06-T005.1` Lint do escopo de components do modulo.
- `PR06-T005.2` Regressao de testes web relevantes do modulo reports.
- `PR06-T005.3` Build de producao em diretorio temporario para validar bundle sem poluir artefatos versionados.

Resultado:
- Escopo compilando e sem erros de lint.

---

## Evidencias de Teste (Gate tecnico)

### 1) Lint web (escopo alterado)
Comando:
- `pnpm --filter @repo/web exec eslint src/components/report/LocationMap.tsx src/components/report/StepLocation.tsx src/components/report/MapSkeleton.tsx`

Resultado:
- `PASS`

### 2) Regressao web (reports)
Comando:
- `pnpm --filter @repo/web test -- src/services/report.service.test.ts src/lib/imageCompression.test.ts`

Resultado:
- `PASS` (2 arquivos, 6 testes)

### 3) Build de producao (diretorio temporario)
Comando:
- `pnpm --filter @repo/web exec vite build --outDir .tmp-pr06-build --emptyOutDir`

Resultado:
- `PASS`

---

## Checklist de Saida PR-06

- [x] Skeleton de mapa/tiles implementado.
- [x] CTA flutuante "Confirmar local" implementado.
- [x] Haptic em interacoes do mapa e confirmacao implementado.
- [x] Fallback "Enviar mesmo assim" implementado para erro parcial.
- [x] Lint/test/build tecnico do escopo passou.
- [ ] Validacao manual mobile (GPS permitido/negado + reverse geocode falhando + offline parcial).

---

## Pendencias para fechar 100%

- Executar smoke manual em dispositivo real (Android e iOS Safari):
  - fluxo GPS permitido;
  - fluxo GPS negado;
  - ajuste de pino com haptic;
  - falha de reverse geocode com continuidade via "Enviar mesmo assim";
  - retorno online apos offline parcial.
