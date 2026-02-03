# Melhoria da Página de Horários de Missas

Este documento descreve as melhorias implementadas na página de horários de missas, focando em uma experiência mobile-first, interativa e performática.

## Visão Geral

A nova implementação separa claramente os dados da interface, permitindo flexibilidade e performance. A interface foi construída utilizando **React**, **Tailwind CSS**, **shadcn/ui** e **Framer Motion**.

### Arquitetura de Dados

Os dados foram normalizados em dois grupos principais:
1.  **Locations (Locais)**: Contém informações estáticas sobre as igrejas (nome, bairro, coordenadas, tags).
2.  **Masses (Celebrações)**: Eventos recorrentes ligados a um `locationId` e um dia da semana.

Isso permite filtargem rápida e eficiente no frontend.

## Funcionalidades Principais

### 1. Navegação e Hero Section
- **Sticky App Bar**: Garante acesso constante ao botão de voltar e filtros principais.
- **Hero Dinâmico**: Exibe a "Próxima Missa" com destaque, calculada automaticamente com base no horário atual do usuário.

### 2. Sistema de Filtros Avançado
- **Busca Global**: Pesquisa por nome da comunidade, bairro ou tags (ex: "matriz", "centro").
- **Chips de Dia da Semana**: Filtro rápido via scroll horizontal.
- **Filtros Combináveis**: Drawer (Bottom Sheet) que permite combinar filtros de Bairro, Dia e Tipo de Local.
- **Preview em Tempo Real**: O botão de "Aplicar" mostra quantos resultados foram encontrados antes mesmo de fechar o filtro.

### 3. Interatividade e UX
- **Favoritos**: Usuários podem favoritar locais para acesso rápido. Os favoritos são persistidos no navegador.
- **Animações**: Transições suaves entre estados de filtro e entrada escalonada dos cards.
- **Ações Rápidas**: Botões para abrir no mapa e compartilhar (via Web Share API).

## Estrutura de Arquivos

- `/src/pages/MassesPage.tsx`: Componente principal da página.
- `/src/components/missas/MassCard.tsx`: Componente de visualização de cada missa.
- `/src/components/missas/FiltersSheet.tsx`: Componente de Bottom Sheet para filtros.
- `/src/hooks/useMassFilters.ts`: Hook customizado contendo toda a lógica de negócios e filtragem.
- `/src/data/masses.mock.json`: Fonte de dados.

## Próximos Passos Sugeridos

- Integração com API real para dados dinâmicos.
- Cacheamento de dados via React Query (já preparado na arquitetura).
- Geolocalização para ordenar locais pela distância do usuário.
