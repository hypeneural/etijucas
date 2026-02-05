# Mapa Detalhado de Funcionalidades (Features)

> **Resumo Técnico**: Descrição profunda de cada feature, sua estrutura de dados, endpoints e comportamento no frontend.
> **Última Atualização**: 05/02/2026

---

## 🗳️ Votações e Transparência (Câmara)

Conecta o cidadão às decisões do legislativo municipal. Permite acompanhar vereadores, ver como eles votaram em projetos de lei e interagir (curtir/comentar).

### O que faz
- Lista vereadores ativos e seus perfis completos.
- Exibe pautas de votação (projetos de lei, requerimentos) com status (Aprovado/Rejeitado).
- Mostra o placar e o voto individual de cada vereador (Sim/Não/Abstenção/Ausente).
- Permite feedback do cidadão (Like/Dislike na votação e Comentários estilo fórum).

### Estrutura Técnica
- **Tabelas**: `vereadores`, `votacoes` (sessões), `votos_registro` (o voto em si), `votacao_reactions`, `comments`.
- **Endpoints**:
  - `GET /api/v1/vereadores` e `/{slug}`
  - `GET /api/v1/votacoes` e `/{id}`
  - `POST /api/v1/votacoes/{id}/reaction` (Like/Dislike)
- **Detalhes**:
  - *Recálculo Automático*: Ao salvar um voto no admin, o sistema recalcula o placar e atualiza o status da votação automaticamente (`Votacao::recalcularVotos`).
  - *Vereador*: Tem estatísticas calculadas em tempo real (assiduidade, fidelidade partidária).

---

## 📅 Agenda de Eventos

Calendário oficial da cidade, agregando eventos públicos, privados e comunitários.

### O que faz
- Listagem por data (Hoje, Fim de Semana) e Categoria (Show, Esporte, Religioso).
- Filtro por Bairro.
- **RSVP**: Usuário marca "Vou" e recebe lembretes (futuro).
- Detalhes ricos: Mapa, Ingresso, Organizador, Galeria de Fotos.

### Estrutura Técnica
- **Tabelas**: `events`, `event_categories`, `venues` (locais), `organizers`, `event_rsvps`.
- **Endpoints**:
  - `GET /api/v1/events` (com filtros avançados)
  - `GET /api/v1/events/calendar-summary` (para o widget de calendário)
  - `POST /events/{id}/rsvp`
- **Diferencial**:
  - Suporta eventos recorrentes (RRule) e eventos de múltiplos dias.
  - Integração nativa com mapas e "Adicionar ao Calendário" do celular.

---

## 📢 Denúncias (Fiscaliza Tijucas)

Canal oficial para reportar buracos, iluminação, lixo e outros problemas urbanos. Inspirado no "156" mas focando na experiência mobile.

### O que faz
- Wizard de 5 passos para criar denúncia (Categoria -> Local -> Foto -> Detalhe -> Revisão).
- **Geolocalização**: Pega GPS do celular ou permite apontar no mapa.
- Acompanhamento em tempo real: Status muda de `Recebido` -> `Em Análise` -> `Resolvido`.
- Timeline de histórico da denúncia (quem atendeu, notas da prefeitura).

### Estrutura Técnica
- **Tabelas**: `citizen_reports`, `report_categories`, `report_status_history`, `media`.
- **Endpoints**:
  - `POST /api/v1/reports` (Criação)
  - `GET /api/v1/me/reports` (Minhas denúncias)
- **Offline-First**:
  - Se o usuário estiver sem internet, a denúncia fica no `IndexedDB` e é enviada automaticamente via *Background Sync* quando a conexão voltar.

---

## 🗣️ Boca no Trombone (Fórum)

Espaço comunitário para debates, dúvidas e utilidade pública entre moradores.

### O que faz
- Tópicos organizados por Bairro e Categoria.
- Sistema de Comentários aninhados (Threads).
- Moderação distribuída: Usuários podem "Denunciar" conteúdo ofensivo.
- Engajamento: Likes, contagem de views e "Hot Score" para tópicos populares.

### Estrutura Técnica
- **Tabelas**: `topics`, `comments`, `topic_likes`, `reports` (moderação).
- **Endpoints**:
  - `GET /forum/topics` (Feed infinito)
  - `POST /forum/topics` (Criar discussão)
- **Segurança**:
  - Filtros de *bad words* e *rate limiting* para evitar spam.

---

## 🏖️ Turismo e Pontos Turísticos

Guia de visitação da cidade, focado em atrair visitantes e informar locais.

### O que faz
- Catálogo visual de praias, igrejas, praças e monumentos.
- Informações úteis: "Como chegar", "Preço", "Horários", "Dicas".
- Galeria de fotos e integração com Instagram do local.
- Avaliações e Likes dos visitantes.

### Estrutura Técnica
- **Tabelas**: `tourism_spots`, `tourism_reviews`.
- **Endpoints**:
  - `GET /api/v1/tourism`
- **Frontend**:
  - Layout imersivo com fotos full-screen e transições suaves (`Framer Motion`).

---

## 🗑️ Coleta de Lixo

Informa o dia e tipo de coleta (Orgânico/Reciclável) para cada rua/bairro.

### O que faz
- Usuário seleciona seu Bairro.
- App mostra cards claros: "Hoje passa caminhão X", "Amanhã passa caminhão Y".
- Diferencia coleta convencional de seletiva.

### Estrutura Técnica
- **Status**: *Frontend-Driven* (Dados estáticos otimizados).
- **Fonte de Dados**: `apps/web/src/data/trashScheduleData.ts`.
- **Lógica**: Usa regras de recorrência (RRule) para calcular datas dinamicamente no cliente, sem precisar consultar API todo dia. Isso garante funcionamento 100% offline.

---

## ⛪ Horário de Missas

Agenda completa das paróquias e capelas da cidade.

### O que faz
- Lista igrejas e capelas por bairro.
- Mostra horários de missa agrupados por dia da semana.
- Filtra "Próximas missas" (baseado na hora atual).

### Estrutura Técnica
- **Status**: *Frontend-Driven* (Mock Data).
- **Fonte de Dados**: `apps/web/src/data/masses.mock.json`.
- **Evolução**: Planejado migrar para API (`mass_schedules`) para permitir que paróquias atualizem seus horários via Painel Admin.

---

## 📞 Telefones Úteis

Lista rápida de contatos de emergência e serviços públicos.

### O que faz
- **Smart Dialer**: Clica e liga. Se tiver WhatsApp, abre direto o app.
- Busca instantânea por nome ("SAMU", "Celesc", "Bombeiros").
- Categorias: Emergência, Saúde, Prefeitura, Serviços.
- Destaques: Números mais importantes fixados no topo.

### Estrutura Técnica
- **Tabela**: `phones`.
- **Endpoints**: `GET /api/v1/phones`.
- **Cache**: A lista é cacheada agressivamente no celular, pois em emergência a velocidade é crítica (funciona offline).
