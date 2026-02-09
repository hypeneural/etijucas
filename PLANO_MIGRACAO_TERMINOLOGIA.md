# Plano de Migração: Terminologia "Observada"

Este documento detalha as alterações necessárias para alinhar o módulo de denúncias ao novo posicionamento "Observada".

**Objetivo:** Substituir termos burocráticos/punitivos (Denúncia, Fiscaliza, Reclamante) por termos comunitários (Observação, Observa, Observador).

---

## 1. Arquivos e Alterações

### 1.1 Home: `apps/web/src/components/home/FiscalizaVivo.tsx`

| Local | Texto Atual (Antigo) | Novo Texto (Observada) |
| :--- | :--- | :--- |
| **Título** | `Fiscaliza {cityName}` | `Observa {cityName}` |
| **Subtítulo** | `Denúncias dos cidadãos` | `Observações da comunidade` |
| **KPIs** | `Resolvidos` | `Melhorias` |
| **Progresso** | `Taxa de resolução` | `Taxa de melhorias` |
| **Botão CTA** | `Fazer uma denúncia` | `Registrar observação` |
| **Frase 1** | `🔧 Sua denúncia faz a diferença!` | `👀 Viu algo na rua? Registre uma observação.` |
| **Frase 2** | `📍 Viu algo? Registre agora.` | `📍 Um relato com foto ajuda MUITO os Observadores.` |
| **Frase 3** | `🏆 Cidadãos resolvendo juntos.` | `✅ Acompanhe e compartilhe para acelerar melhorias.` |
| **Frase 4** | `⚡ Tempo médio de resposta: 48h` | `🏆 Observadores de {cidade} fazem a diferença juntos.` |
| **Footer** | *(Novo)* | Adicionar: `Plataforma comunitária e independente. Não é canal oficial da prefeitura.` |

### 1.2 Mini Mapa: `apps/web/src/components/home/FiscalizaMiniMap.tsx`

| Local | Texto Atual | Novo Texto |
| :--- | :--- | :--- |
| **Badge** | `3 denúncias recentes` | `3 observações recentes` |
| **CTA Overlay** | `Ver mapa completo` | `Ver mapa das observações` |

### 1.3 Wizard: `apps/web/src/pages/ReportWizardPage.tsx`

| Local | Texto Atual | Novo Texto |
| :--- | :--- | :--- |
| **Header** | `Enviar Denúncia` | `Nova observação` |
| **Steps** | `Categoria`, `Localização`, `Fotos`, `Revisão` | `Tipo`, `Local`, `Fotos`, `Resumo` |
| **Erro Categoria** | `Selecione uma categoria para a denúncia` | `Escolha um tipo de observação` |
| **Erro Título** | `O título deve ter...` | `Dê um título curto (mín. 5 caracteres)` |
| **Sucesso** | `Denúncia enviada com sucesso!` | `Observação publicada!` |
| **Offline** | `Denúncia salva offline...` | `Observação salva no rascunho. Enviamos quando a conexão voltar.` |
| **Erro Genérico** | `Erro ao enviar denúncia...` | `Não foi possível publicar agora. Tente novamente.` |
| **Login Req** | `Entre para denunciar` | `Entrar para publicar` |
| **Login Msg** | `É rápido! Basta confirmar...` | `É rápido: confirme seu número de WhatsApp e participe como Observador.` |

### 1.4 Mapa Full: `apps/web/src/screens/ReportsMapScreen.tsx`

| Local | Texto Atual | Novo Texto |
| :--- | :--- | :--- |
| **Header** | `Mapa` | `Mapa das observações` |
| **Contador** | `{n} de {m} denúncias` | `{n} de {m} observações` |
| **Drawer Título** | `Detalhes da Denúncia` (implícito) | `Detalhes da observação` |
| **Botão Detalhes** | `Ver Detathes Completos` | `Ver detalhes completos` |
| **Status Label** | `Recebido` | `Recebido` |
| **Status Label** | `Em Análise` | `Em verificação` |
| **Status Label** | `Resolvido` | `Melhoria concluída` |
| **Status Label** | `Rejeitado` | `Arquivado` |
| **Sem Fotos** | `Esta denúncia não possui fotos...` | `Sem fotos anexadas` |
| **Rotas** | `Rotas` | `Como chegar` |
| **Share** | `Compartilhar` | `Compartilhar com Observadores` |

### 1.5 Minhas Denúncias: `apps/web/src/pages/MyReportsPage.tsx`

| Local | Texto Atual | Novo Texto |
| :--- | :--- | :--- |
| **Header** | `Minhas Denúncias` | `Minhas observações` |
| **Login Title** | `Entrar para ver denúncias` | `Entrar para ver minas observações` |
| **Login Msg** | `...acompanhar suas denúncias` | `...acompanhar suas observações` |
| **Empty State** | `Nenhuma denúncia` | `Nenhuma observação` |
| **Empty Msg** | `Você ainda não enviou nenhuma denúncia.` | `Você ainda não registrou nenhuma observação.` |
| **Botão Empty** | `Fazer primeira denúncia` | `Registrar primeira observação` |
| **Status Labels** | *(Igual ao Mapa)* | *(Aplicar novos labels)* |

### 1.6 Detalhes: `apps/web/src/pages/ReportDetailPage.tsx`

| Local | Texto Atual | Novo Texto |
| :--- | :--- | :--- |
| **Header** | `Denúncia` | `Observação` |
| **Protocolo** | `Protocolo` | `Código de acompanhamento` |
| **Share Text** | `Acompanhe esta denúncia...` | `Sou Observador em {cidade}. Olha essa observação: {titulo}` |
| **Status Labels** | *(Igual ao Mapa)* | *(Aplicar novos labels)* |
| **Disclaimer** | *(Novo)* | Adicionar no rodapé: `Plataforma comunitária e independente.` |

---

## 2. Plano de Execução

1.  **Criar Dicionário (Opcional)**: Como o projeto não usa i18n ainda, faremos a substituição direta nas strings ("Hardcoded").
2.  **Aplicar Mudanças por Arquivo**: Seguir a ordem acima.
3.  **Verificação**:
    *   Varrer código novamente por "denúncia" e "fiscaliza" para garantir que nada visual sobrou.
    *   As chaves de API (`recebido`, `em_analise`) **NÃO** mudam, apenas o `label` de exibição.

## 3. Próximos Passos (Futuros Sprints)

*   [ ] Implementar "Viral Loop 1": Compartilhar como convite no sucesso do Wizard.
*   [ ] Implementar "Viral Loop 2": Botão "Eu vi também" / "Apoiar".
*   [ ] Criar badges de gamificação ("Observador Ativo").
