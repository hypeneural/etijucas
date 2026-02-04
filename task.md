# Task - Melhorias Administrativas (Painel Filament)

## Prioridade alta
- [x] Normalizar labels PT-BR quebrados no modulo Forum (admin e front).
- [x] Incluir grupo de navegacao `Forum` no painel e revisar ordenacao dos menus por fluxo operacional.
- [x] Criar fluxo de atribuicao de responsavel nas denuncias (responsavel_id + status + nota).
- [x] Rodar migration nova de atribuicao (`assigned_to`, `assigned_at`) em `citizen_reports`.
- [x] Exibir SLA/tempo em aberto nas denuncias e destacar atrasos.
- [x] Adicionar acao rapida para mudar status da denuncia com nota diretamente na listagem.
- [x] Adicionar auditoria obrigatoria para acoes de moderacao (denuncias, forum, flags).
- [x] Criar pagina de calendario (mes/semana) para eventos no admin.
- [x] Adicionar actions rapidas em eventos: publicar, despublicar, destacar, duplicar.
- [x] Revisar permissoes de pages/widgets e garantir admin vs moderator.

## Prioridade media
- [x] Consolidar fila de moderacao com filtros por prioridade/tipo e links diretos.
- [x] Melhorar filtros de denuncias (categoria, bairro, status, data) com indices garantidos.
- [ ] Adicionar preview de mapa no formulario de denuncia e acao rapida de ajuste.
- [x] Adicionar acao rapida de ocultar/restaurar comentario no forum.
- [x] Exibir contexto do conteudo denunciado (trecho + link) em reports.
- [ ] Exibir KPIs de moderacao com cache curto (30-120s).
- [ ] Implementar `deferLoading()` em tabelas volumosas do admin.
- [ ] Melhorar busca nas listagens (titulo, protocolo, usuario, bairro).

## Prioridade baixa
- [ ] Padronizar badges e cores de status em todos os recursos.
- [ ] Revisar helper texts e placeholders para reduzir erro humano.
- [ ] Refino visual de formularios longos (sections e colunas consistentes).
- [ ] Padronizar imports por URL com actions de migracao de midia.
- [ ] Revisar consistencia de nomenclatura entre API e painel (ex.: status e enums).
