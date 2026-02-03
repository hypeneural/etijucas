<?php

/**
 * Forum Domain
 * 
 * Este domínio contém toda a lógica relacionada ao fórum:
 * - Topics (criação, edição, exclusão, listagem)
 * - Comments (criação, exclusão)
 * - Likes (topics e comments)
 * - Reports/Denúncias de conteúdo
 * - Saved Topics
 * 
 * Estrutura:
 * - Http/Controllers/   → Controllers da API
 * - Http/Requests/      → Form Requests (validação)
 * - Http/Resources/     → API Resources (transformação)
 * - Actions/            → Ações únicas (CreateTopicAction)
 * - Policies/           → Autorização (TopicPolicy)
 * - Models/             → Eloquent Models
 * - Services/           → Lógica complexa
 * 
 * @see FEATURES.md para mapa completo de endpoints
 */
