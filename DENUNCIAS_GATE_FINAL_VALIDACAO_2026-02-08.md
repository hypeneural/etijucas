# Gate Final de Validacao - Modulo Denuncias

Data: 2026-02-08  
Projeto: `etijucas`  
Status atual: PR-01..PR-10 entregues tecnicamente; restam validacoes manuais/de ambiente.

---

## Objetivo

Fechar os ultimos riscos operacionais (mobile real, ambiente integrado e observabilidade) antes de considerar o modulo como `100% pronto para rollout`.

---

## Ordem de Execucao (prioridade)

1. `FINAL-T001` Workflow CI em execucao real
2. `FINAL-T002` Amostragem real de compressao de imagem (PR-05)
3. `FINAL-T003` Smoke mobile real do mapa e localizacao (PR-06)
4. `FINAL-T004` Validacao de logs de throttle por tenant (PR-07)
5. `FINAL-T005` Decisao/implementacao de UX para conflito 409 (PR-08)
6. `FINAL-T006` EXPLAIN de queries chave em MySQL/MariaDB (PR-09)
7. `FINAL-T007` Sign-off final

---

## Task Board (com IDs)

### `FINAL-T001` - Validar workflow CI em ambiente remoto
Status: `PENDING`
Objetivo: garantir que o gate de reports rode de forma automatica fora da maquina local.

Subtarefas:
- `FINAL-T001.1` Abrir PR com alteracao pequena no escopo monitorado de reports.
- `FINAL-T001.2` Confirmar disparo de `.github/workflows/reports-quality-gate.yml`.
- `FINAL-T001.3` Confirmar `PASS` do job `reports-gate`.
- `FINAL-T001.4` Capturar URL do run para evidencia.

DoD:
- Workflow executa automaticamente em `pull_request`.
- Job conclui com sucesso.

---

### `FINAL-T002` - Validar meta real de compressao de imagem
Status: `PENDING`
Objetivo: confirmar o alvo de performance de upload em dispositivos/rede real.

Subtarefas:
- `FINAL-T002.1` Coletar amostra de 30 imagens reais (camera de celular, cenarios variados).
- `FINAL-T002.2` Registrar tamanho original x comprimido.
- `FINAL-T002.3` Verificar taxa de sucesso: `>= 90%` com arquivo final `<= 400KB`.
- `FINAL-T002.4` Validar upload em rede movel (4G/3G simulado) sem timeout sistemico.

DoD:
- Meta de tamanho validada em amostra real.
- Relatorio curto anexado com percentuais.

---

### `FINAL-T003` - Smoke mobile real do step de localizacao
Status: `PENDING`
Objetivo: validar UX premium e continuidade de fluxo em dispositivos reais.

Subtarefas:
- `FINAL-T003.1` Android Chrome: GPS permitido, ajustar pino, confirmar local.
- `FINAL-T003.2` Android Chrome: GPS negado, fluxo manual via mapa.
- `FINAL-T003.3` iOS Safari: abrir step, ajustar pino, confirmar local.
- `FINAL-T003.4` Simular falha de reverse geocode e validar CTA "Enviar mesmo assim".
- `FINAL-T003.5` Simular offline parcial e retorno online sem travamento.

DoD:
- Nenhum bloqueio de envio por erro parcial.
- Fluxo de localizacao funcional em Android e iOS.

---

### `FINAL-T004` - Validar bloqueios de rate limit com observabilidade
Status: `PENDING`
Objetivo: confirmar que regras tenant+ip estao ativas e auditaveis.

Subtarefas:
- `FINAL-T004.1` Executar burst de requests de criacao (`>10/h`) no Tenant A.
- `FINAL-T004.2` Confirmar resposta `429` apos limite.
- `FINAL-T004.3` Confirmar Tenant B nao impactado.
- `FINAL-T004.4` Validar logs com campos minimos: tenant, ip, rota, metodo.

DoD:
- Isolamento por tenant comprovado em ambiente integrado.
- Logs de bloqueio disponiveis para auditoria.

---

### `FINAL-T005` - Fechar UX de conflito 409 no ponto de consumo
Status: `PENDING`
Objetivo: remover pendencia funcional da PR-08 no frontend de moderacao/gestao.

Subtarefas:
- `FINAL-T005.1` Identificar tela real que executa update de status.
- `FINAL-T005.2` Implementar tratamento visual para `REPORT_STATUS_CONFLICT`.
- `FINAL-T005.3` Exibir CTA claro: "Atualizar dados" e "Tentar novamente".
- `FINAL-T005.4` Adicionar teste de interface (unit/integration) do estado de conflito.

DoD:
- Usuario recebe mensagem clara quando ocorre conflito.
- Fluxo de refresh/retry funcional.

---

### `FINAL-T006` - EXPLAIN em banco de staging/producao
Status: `PENDING`
Objetivo: comprovar ganho real dos indices compostos.

Subtarefas:
- `FINAL-T006.1` Rodar EXPLAIN da listagem por cidade e data.
- `FINAL-T006.2` Rodar EXPLAIN por cidade+status+data.
- `FINAL-T006.3` Rodar EXPLAIN por cidade+categoria(+data).
- `FINAL-T006.4` Validar uso de indice (`key` nao nulo; cardinalidade coerente).

DoD:
- Queries chave usando indices compostos esperados.
- Evidencia registrada com output resumido.

---

### `FINAL-T007` - Sign-off de release do modulo
Status: `PENDING`
Objetivo: consolidar liberacao com trilha de evidencias.

Subtarefas:
- `FINAL-T007.1` Confirmar `pnpm check:reports` local em estado final.
- `FINAL-T007.2` Confirmar `FINAL-T001..FINAL-T006` concluido.
- `FINAL-T007.3` Atualizar checklist central com status final.
- `FINAL-T007.4` Registrar changelog tecnico de release.

DoD:
- Sem pendencias criticas abertas.
- Modulo pronto para rollout controlado.

---

## Evidencia tecnica local (ja executada)

- Comando: `pnpm check:reports`
- Resultado: `PASS` (contracts, features, lint web, testes web, testes API reports)

