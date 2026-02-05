# ETijucas - Analise Atualizada do App, Diferenciais e Proposta de Patrocinio

**Foco**: Tijucas/SC, com conteudo por bairro, utilidade diaria e participacao cidada.  
**Ultima atualizacao**: 2026-02-05

**Objetivo deste documento**: consolidar o que o app ja entrega de valor, por que ele e unico na cidade e por que e uma excelente plataforma para patrocinio local.

**Fontes internas**
`README.md`  
`FEATURES.md`  
`HOME_MELHORIAS.md`  
`BAIRROS_ENDERECOS_CEP_ANALISE.md`

**Stack (versoes reais)**
Backend:
- PHP 8.2, Laravel 12, Sanctum 4.2
- Filament 3.3, Spatie Permission 6.24, Media Library 11.17

Frontend:
- React 18.3.1, TypeScript 5.8.3, Vite 5.4.x
- Tailwind 3.4.x, TanStack Query 5.83, Zustand 5.0.x
- Framer Motion 12.29, Radix UI (components), Workbox 7.4 (PWA)

## Visao geral do app
O ETijucas e uma plataforma digital da cidade, com PWA mobile-first e API propria. O foco e **resolver o dia a dia do morador** e **dar voz a comunidade**, com conteudo hiperlocal por bairro. A Home funciona como um painel diario vivo ("Hoje em Tijucas") que agrega informacoes, alertas, servicos e participacao cidadã em um unico fluxo.

## O que o app ja tem (features reais)
**Home "Hoje em Tijucas" (painel vivo)**
- Agregador de dados em 1 request (alertas, clima, boletim, fiscaliza, forum, quick access, eventos, turismo, stats).
- Header compacto com clima e seletor de bairro.
- Boletim do Dia como primeiro ritual do usuario.
- Cards vivos: Fiscaliza Tijucas e Boca no Trombone.
- Quick Access com badges dinamicos (servicos essenciais).
- Events carousel e Tourism highlights.
- Contador "Tijucanos" com metas e progresso.

**Cidadania e comunidade**
- Forum (Boca no Trombone) com topicos, comentarios, curtidas e denuncias.
- Fiscaliza Tijucas com denuncias cidadas, fotos e acompanhamento de status.
- Mapa de denuncias e filtros por bairro.

**Agenda e vida na cidade**
- Eventos com filtros, favoritos, RSVP e calendario.
- Turismo com pontos, destaques e detalhes.
- Missas por igreja e bairro.
- Coleta de lixo por bairro.
- Telefones uteis com busca rapida.

**Transparencia publica**
- Vereadores e votacoes, com reacoes e comentarios.

**Bairros como contexto central**
- Bairros sao usados em forum, denuncias, eventos, turismo e alertas.
- Seletor de bairro funciona para usuarios logados e convidados.
- Cache local de bairros para uso offline.

**Autenticacao e perfil**
- OTP via WhatsApp, login, cadastro e refresh token.
- Perfil com avatar e preferencias de notificacao.

**Admin e moderacao**
- Painel Filament com recursos de moderacao, conteudo e gestao de dados.

**Offline-first e PWA**
- Cache e IndexedDB.
- App instalavel no celular sem loja.
- Revalidacao em segundo plano.

## Por que o app e unico em Tijucas
- **Hiperlocal real**: o bairro e o filtro principal, nao um detalhe.
- **Painel diario vivo**: a Home e utilidade imediata, nao um menu.
- **Cidadania ativa integrada**: denuncia + forum + transparencia no mesmo lugar.
- **Acesso facil**: funciona sem login e em conexoes fracas.
- **Escalavel**: arquitetura moderna e pronta para evoluir.

## Por que ele tem alto potencial viral
**Ja existe base de engajamento real**
- Conteudo util do dia (clima, alertas, eventos, boletim).
- Participacao comunitaria (forum e denuncias geram conversa local).
- Conteudo por bairro ativa o "perto de mim".

**Gatilhos naturais para viralizacao**
- Compartilhamento de boletim, eventos e metas da cidade.
- Micro-acoes diarias (ver boletim, votar em enquete, apoiar denuncia).
- Prova social com contador de tijucanos e metas.

## Diferenciais tecnicos e de produto
- Home com agregador reduz requests e aumenta performance real.
- PWA com cache e offline-first para uso em campo.
- UX mobile com animacoes e interacoes nativas.
- Admin profissional para moderacao e governanca.

## Impacto direto para Tijucas/SC
- Centraliza informacao local e servicos essenciais.
- Reduz friccao para reportar problemas urbanos.
- Facilita descoberta de eventos e turismo.
- Aumenta transparencia politica com votacoes.
- Fortalece senso de comunidade por bairro.

## Por que uma empresa deveria patrocinar o ETijucas
**Retorno de marca local**
- Presenca diaria na Home e nos principais fluxos.
- Associacao direta com utilidade publica.

**Impacto social e ESG**
- Apoio a cidadania digital e servicos locais.
- Marca conectada a melhoria urbana e transparencia.

**Segmentacao hiperlocal**
- Campanhas por bairro e contexto.
- Patrocinio contextual por modulo (eventos, turismo, boletim).

**Modelos de patrocinio possiveis**
- Bloco patrocinado na Home ("Parceiro do Dia").
- Apoio a eventos e destaques culturais.
- Patrocinio do Boletim do Dia.
- Campanhas por bairro (ex: coleta, alertas, eventos).

## Por que o ETijucas e unico como plataforma de patrocinio
- Publico recorrente e de alta frequencia (uso diario potencial).
- Conteudo gerado pela comunidade aumenta engagement sem custo extra.
- PWA reduz barreira de acesso e aumenta alcance.

## Oportunidades de expansao (curto prazo)
- Streak e check-in por micro-acao (ritual diario).
- Compartilhamento nativo de cards (boletim, eventos, metas).
- Bloco "Perto de voce" com contexto por bairro.
- Enquetes relampago diarias para engajamento.

## Por que o ETijucas e o app certo para Tijucas
- Nao e apenas informativo: e participativo.
- Nao e genérico: e construido para bairros reais da cidade.
- Nao depende de loja: funciona como PWA, acessivel para todos.

