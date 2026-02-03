export const bairros = [
  { id: 'bairros-1', nome: 'Centro' },
  { id: 'bairros-2', nome: 'Universitário' },
  { id: 'bairros-3', nome: 'Praia' },
];

export const forumTopics = [
  {
    id: 'topic-1',
    titulo: 'Buraco na rua principal',
    texto: 'Existe um buraco grande na Rua XV e está causando trânsito.',
    categoria: 'reclamacao',
    categoriaLabel: 'Reclamação',
    categoriaColor: '#ef4444',
    bairroId: bairros[0].id,
    isAnon: false,
    fotoUrl: null,
    likesCount: 12,
    commentsCount: 3,
    status: 'active',
    liked: false,
    isSaved: false,
    autor: {
      id: 'user-1',
      nome: 'João Silva',
      avatarUrl: null,
    },
    bairro: bairros[0],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export const events = [
  {
    id: 'event-1',
    title: 'Feira de Artesanato',
    descriptionShort: 'Feira com expositores locais',
    coverImageUrl: null,
    startDateTime: new Date().toISOString(),
    endDateTime: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
    category: {
      id: 'cat-1',
      name: 'Cultura',
      slug: 'cultura',
      color: '#22c55e',
    },
    venue: {
      name: 'Praça Central',
      bairro: 'Centro',
    },
  },
];

export const authUser = {
  id: 'user-1',
  name: 'João Silva',
  email: 'joao@etijucas.com.br',
};
