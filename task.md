# Task - Melhorias do Painel Admin (Titulos, Menu e Organizacao)

## Prioridade alta
- [ ] Padronizar titulos das paginas que ainda aparecem em ingles
Subtarefas:
- [ ] `/admin/users`: definir titulo PT-BR (Usuarios) e descricao breve na listagem.
- [ ] `/admin/moderation-queue`: definir titulo PT-BR (Fila de Moderacao) + descricao breve abaixo do titulo.
- [ ] `/admin/content-flags`: definir titulo PT-BR (Denuncias de Conteudo) + descricao breve.
- [ ] `/admin/reports-dashboard`: definir titulo PT-BR (Dashboard de Denuncias) + descricao breve.
- [ ] Usar `protected static ?string $title` ou `getTitle()`/`getSubheading()` nas Pages para exibir o subtitulo.

- [ ] Corrigir itens do menu com encoding quebrado
Subtarefas:
- [ ] Normalizar labels e grupos para UTF-8 (sem BOM).
- [ ] Ajustar strings com acento quebrado (ex: "Fila de Moderação", "Comentários", "Restrições", "Localização", "Denúncias", "Telefones Úteis").
- [ ] Revisar `AdminPanelProvider` para nomes corretos dos grupos: **Acesso & Usuários**, **Moderação**, **Fórum**, **Votações**, **Conteúdo**.

- [ ] Separar "Denuncias" duplicadas no menu
Subtarefas:
- [ ] Renomear `CitizenReportResource` para **Denuncias Cidadas**.
- [ ] Renomear `ContentFlagResource` para **Denuncias de Conteudo** (ou **Flags de Conteudo**).

## Prioridade media
- [ ] Reorganizar menu por dominios funcionais
Subtarefas:
- [ ] Criar grupos: **Eventos**, **Turismo**, **Forum**, **Moderação**, **Votações**, **Acesso & Usuários**, **Sistema & Auditoria**.
- [ ] Mover recursos de eventos para **Eventos** (Eventos, Categorias, Locais, Organizadores, RSVPs, Tags, Calendario).
- [ ] Mover recursos de turismo para **Turismo** (Pontos, Avaliacoes).
- [ ] Mover recursos de forum para **Forum** (Topicos, Comentarios, Reports).
- [ ] Mover denuncias/flags/dashboards para **Moderação**.
- [ ] Manter Auditoria em **Sistema & Auditoria**.

- [ ] Padronizar nomes tecnicos para PT-BR claro
Subtarefas:
- [ ] `RSVPs` -> **Confirmacoes (RSVP)**.
- [ ] `Reviews Turismo` -> **Avaliacoes de Turismo**.
- [ ] `Tags` -> **Tags de Eventos** (se for exclusivo de eventos).

## Prioridade baixa
- [ ] Garantir consistencia visual de titulos + subtitulos em Pages e Resources
Subtarefas:
- [ ] Padronizar `navigationLabel`, `modelLabel`, `pluralModelLabel` em todos os Resources.
- [ ] Usar descricao curta (subheading) padronizada nas Pages principais.
- [ ] Ajustar `navigationSort` para fluxo operacional (Moderação no topo, depois eventos/turismo).

- [ ] Checklist final de validacao
Subtarefas:
- [ ] Conferir menu completo sem duplicatas e sem labels quebrados.
- [ ] Validar paginas principais com titulo PT-BR e descricao exibida.
- [ ] Validar que a navegacao segue o agrupamento por dominio.
