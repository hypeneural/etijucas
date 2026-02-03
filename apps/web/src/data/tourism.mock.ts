// Mock data for Tourism - Pontos Turísticos
import type { TourismSpotEnhanced, TourismReview } from '@/types/tourism.types';

export const tourismSpotsMock: TourismSpotEnhanced[] = [
  {
    id: '1',
    titulo: 'Praia de Tijucas',
    descCurta: 'Praia tranquila com águas calmas, perfeita para famílias e esportes náuticos.',
    descLonga: `A Praia de Tijucas é um verdadeiro refúgio para quem busca tranquilidade e contato com a natureza. Com águas calmas e cristalinas, é ideal para banho de crianças e prática de stand-up paddle, caiaque e vela.

A orla conta com quiosques que servem frutos do mar frescos e petiscos típicos da região. Ao pôr do sol, a vista é simplesmente espetacular, com tons de laranja e rosa refletidos nas águas.

**Destaques:**
- Águas calmas e rasas
- Excelente para esportes náuticos
- Quiosques com gastronomia local
- Pôr do sol memorável`,
    categoria: 'praia',
    tags: ['natureza', 'família', 'praia', 'esportes'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800', caption: 'Vista panorâmica da praia' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1519046904884-53103b34b206?w=800', caption: 'Águas cristalinas' },
      { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1473116763249-2faaef81ccda?w=800', caption: 'Pôr do sol na praia' },
      { id: '4', type: 'video', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ', thumbnailUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400', caption: 'Tour pela praia' },
    ],
    endereco: 'Av. Beira-Mar, s/n - Centro',
    bairroId: '1',
    bairroNome: 'Centro',
    latitude: -27.2420,
    longitude: -48.6344,
    comoChegar: 'Acesso fácil pela Av. Beira-Mar, com estacionamento público gratuito. Ônibus linha 101 para na entrada.',
    horarios: [
      { day: 0, dayLabel: 'Domingo', open: '00:00', close: '23:59' },
      { day: 1, dayLabel: 'Segunda', open: '00:00', close: '23:59' },
      { day: 2, dayLabel: 'Terça', open: '00:00', close: '23:59' },
      { day: 3, dayLabel: 'Quarta', open: '00:00', close: '23:59' },
      { day: 4, dayLabel: 'Quinta', open: '00:00', close: '23:59' },
      { day: 5, dayLabel: 'Sexta', open: '00:00', close: '23:59' },
      { day: 6, dayLabel: 'Sábado', open: '00:00', close: '23:59' },
    ],
    rating: 4.7,
    reviewsCount: 234,
    likesCount: 1520,
    liked: false,
    isSaved: false,
    viewsCount: 12450,
    preco: 'gratis',
    duracao: '2-4 horas',
    dificuldade: 'facil',
    acessibilidade: ['Rampa de acesso', 'Cadeiras anfíbias disponíveis'],
    dicasVisita: [
      'Chegue cedo para garantir lugar nos quiosques',
      'Leve protetor solar - não há muita sombra natural',
      'Os melhores horários são ao nascer e pôr do sol',
    ],
    isDestaque: true,
    isVerificado: true,
    createdAt: '2024-01-01T10:00:00Z',
    updatedAt: '2024-01-20T15:30:00Z',
  },
  {
    id: '2',
    titulo: 'Igreja Matriz São Sebastião',
    descCurta: 'Igreja histórica do século XIX, marco arquitetônico e religioso de Tijucas.',
    descLonga: `A Igreja Matriz São Sebastião é o coração espiritual de Tijucas. Construída em 1830, a igreja é um exemplo notável da arquitetura colonial portuguesa adaptada ao clima tropical brasileiro.

O interior impressiona com seus vitrais coloridos, altar de madeira entalhada à mão e pinturas do teto que narram passagens bíblicas. A torre do sino oferece uma vista privilegiada da cidade para quem faz a subida.

**Destaques:**
- Arquitetura colonial preservada
- Vitrais centenários
- Missas com coral aos domingos
- Vista panorâmica do alto da torre`,
    categoria: 'religioso',
    tags: ['cultura', 'história', 'arquitetura', 'religioso'],
    imageUrl: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=800', caption: 'Fachada principal' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800', caption: 'Interior da igreja' },
      { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1438032005730-c779502df39b?w=800', caption: 'Vitrais coloridos' },
    ],
    endereco: 'Praça Nereu Ramos, 100 - Centro',
    bairroId: '1',
    bairroNome: 'Centro',
    latitude: -27.2385,
    longitude: -48.6352,
    comoChegar: 'Localizada na praça central, fácil acesso a pé do centro. Estacionamento nas ruas adjacentes.',
    telefone: '(47) 3263-0100',
    website: 'https://www.paroquiatijucas.com.br',
    instagram: '@igrejatijucas',
    horarios: [
      { day: 0, dayLabel: 'Domingo', open: '06:00', close: '20:00' },
      { day: 1, dayLabel: 'Segunda', open: '07:00', close: '18:00' },
      { day: 2, dayLabel: 'Terça', open: '07:00', close: '18:00' },
      { day: 3, dayLabel: 'Quarta', open: '07:00', close: '18:00' },
      { day: 4, dayLabel: 'Quinta', open: '07:00', close: '18:00' },
      { day: 5, dayLabel: 'Sexta', open: '07:00', close: '18:00' },
      { day: 6, dayLabel: 'Sábado', open: '07:00', close: '19:00' },
    ],
    rating: 4.9,
    reviewsCount: 187,
    likesCount: 890,
    preco: 'gratis',
    duracao: '30min - 1 hora',
    dificuldade: 'facil',
    acessibilidade: ['Rampa lateral', 'Lugares reservados'],
    dicasVisita: [
      'Visite durante a missa de domingo com coral às 10h',
      'A subida à torre é possível mediante agendamento',
      'Respeite o silêncio e vestuário adequado',
    ],
    isDestaque: true,
    isVerificado: true,
    createdAt: '2024-01-01T10:00:00Z',
  },
  {
    id: '3',
    titulo: 'Trilha do Morro do Boi',
    descCurta: 'Trilha com vista panorâmica incrível da cidade e do vale do Rio Tijucas.',
    descLonga: `A Trilha do Morro do Boi é uma aventura imperdível para os amantes de natureza e caminhadas. Com cerca de 3km de extensão, a trilha oferece diferentes níveis de dificuldade e culmina em um mirante natural com vista de 360° de Tijucas e região.

O percurso passa por mata atlântica preservada, com chance de avistar tucanos, saguis e diversas espécies de pássaros. No topo, é possível ver o encontro do Rio Tijucas com o mar.

**Destaques:**
- Vista panorâmica de 360°
- Mata atlântica preservada
- Fauna silvestre
- Cachoeira no meio do percurso`,
    categoria: 'aventura',
    tags: ['natureza', 'aventura', 'esporte', 'trilha'],
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=800', caption: 'Início da trilha' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1501555088652-021faa106b9b?w=800', caption: 'Vista do mirante' },
      { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1440342359743-84fcb8c21f21?w=800', caption: 'Cachoeira' },
    ],
    endereco: 'Estrada do Morro do Boi, s/n - Rural',
    bairroId: '8',
    bairroNome: 'Rio do Meio',
    latitude: -27.2580,
    longitude: -48.6520,
    comoChegar: 'Acesso pela SC-410, seguir placas indicativas. Estacionamento no início da trilha (limitado).',
    rating: 4.8,
    reviewsCount: 156,
    likesCount: 720,
    preco: 'gratis',
    duracao: '2-3 horas',
    dificuldade: 'moderada',
    acessibilidade: [],
    dicasVisita: [
      'Use calçados apropriados para trilha',
      'Leve água e lanche - não há estrutura no percurso',
      'Evite dias de chuva - trilha escorregadia',
      'Comece cedo para evitar o sol forte',
    ],
    isDestaque: false,
    isVerificado: true,
    createdAt: '2024-01-05T14:00:00Z',
  },
  {
    id: '4',
    titulo: 'Mercado Municipal',
    descCurta: 'Produtos locais, artesanato, gastronomia típica e o melhor da cultura açoriana.',
    descLonga: `O Mercado Municipal de Tijucas é um verdadeiro centro cultural e gastronômico. Aqui você encontra o melhor da produção local: frutas frescas, frutos do mar, queijos artesanais, embutidos coloniais e o famoso pastel de berbigão.

O espaço também abriga ateliês de artesanato, onde artistas locais produzem cerâmicas, rendas de bilro e esculturas em madeira. Aos sábados, o mercado ganha vida extra com apresentações de músicos locais.

**Destaques:**
- Gastronomia local autêntica
- Artesanato açoriano
- Feira de orgânicos aos sábados
- Música ao vivo nos fins de semana`,
    categoria: 'gastronomia',
    tags: ['cultura', 'gastronomia', 'compras', 'artesanato'],
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=800', caption: 'Entrada do mercado' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800', caption: 'Bancas de frutas' },
      { id: '3', type: 'image', url: 'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=800', caption: 'Artesanato local' },
    ],
    endereco: 'Rua Hercílio Luz, 245 - Centro',
    bairroId: '1',
    bairroNome: 'Centro',
    latitude: -27.2395,
    longitude: -48.6348,
    comoChegar: 'Centro da cidade, próximo à praça. Estacionamento rotativo na rua.',
    telefone: '(47) 3263-8100',
    horarios: [
      { day: 0, dayLabel: 'Domingo', open: '06:00', close: '13:00' },
      { day: 1, dayLabel: 'Segunda', open: '00:00', close: '00:00', isClosed: true },
      { day: 2, dayLabel: 'Terça', open: '06:00', close: '18:00' },
      { day: 3, dayLabel: 'Quarta', open: '06:00', close: '18:00' },
      { day: 4, dayLabel: 'Quinta', open: '06:00', close: '18:00' },
      { day: 5, dayLabel: 'Sexta', open: '06:00', close: '18:00' },
      { day: 6, dayLabel: 'Sábado', open: '06:00', close: '14:00' },
    ],
    rating: 4.5,
    reviewsCount: 312,
    likesCount: 1150,
    preco: 'barato',
    duracao: '1-2 horas',
    dificuldade: 'facil',
    acessibilidade: ['Acessível para cadeirantes', 'Banheiros adaptados'],
    dicasVisita: [
      'Vá aos sábados para a feira de orgânicos',
      'Experimente o pastel de berbigão - especialidade local',
      'Chegue cedo - os melhores produtos acabam rápido',
    ],
    isDestaque: true,
    isVerificado: true,
    createdAt: '2024-01-02T08:00:00Z',
  },
  {
    id: '5',
    titulo: 'Parque Linear do Rio Tijucas',
    descCurta: 'Área verde com pista de caminhada, playground e espaço para piquenique.',
    descLonga: `O Parque Linear do Rio Tijucas é o pulmão verde da cidade. Com mais de 2km de extensão às margens do rio, oferece estrutura completa para lazer e esportes.

A pista de caminhada e ciclovia asfaltada serpenteia entre árvores nativas, com pontos de descanso e equipamentos de ginástica. O playground é moderno e seguro, e há áreas gramadas perfeitas para piqueniques em família.`,
    categoria: 'lazer',
    tags: ['natureza', 'família', 'esporte', 'lazer'],
    imageUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=800', caption: 'Vista geral do parque' },
      { id: '2', type: 'image', url: 'https://images.unsplash.com/photo-1519331379826-f10be5486c6f?w=800', caption: 'Playground' },
    ],
    endereco: 'Av. Getúlio Vargas, s/n - Centro',
    bairroId: '1',
    bairroNome: 'Centro',
    latitude: -27.2410,
    longitude: -48.6360,
    rating: 4.3,
    reviewsCount: 89,
    likesCount: 456,
    preco: 'gratis',
    duracao: '1-3 horas',
    dificuldade: 'facil',
    acessibilidade: ['Totalmente acessível', 'Banheiros adaptados', 'Piso tátil'],
    isDestaque: false,
    isVerificado: true,
    createdAt: '2024-01-10T12:00:00Z',
  },
  {
    id: '6',
    titulo: 'Casa da Cultura',
    descCurta: 'Centro cultural com exposições, teatro e oficinas de arte.',
    descLonga: `A Casa da Cultura de Tijucas ocupa um casarão histórico restaurado e funciona como centro de difusão artística e cultural. O espaço abriga exposições temporárias de artistas locais e regionais, além de uma galeria permanente sobre a história da cidade.

O teatro com 150 lugares recebe peças, shows acústicos e palestras. Há também oficinas gratuitas de pintura, cerâmica e música para todas as idades.`,
    categoria: 'cultura',
    tags: ['cultura', 'arte', 'história', 'teatro'],
    imageUrl: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800',
    gallery: [
      { id: '1', type: 'image', url: 'https://images.unsplash.com/photo-1518998053901-5348d3961a04?w=800', caption: 'Fachada da Casa da Cultura' },
    ],
    endereco: 'Rua Coronel Bernardino, 80 - Centro',
    bairroId: '1',
    bairroNome: 'Centro',
    latitude: -27.2388,
    longitude: -48.6355,
    telefone: '(47) 3263-8200',
    website: 'https://cultura.tijucas.sc.gov.br',
    instagram: '@culturatijucas',
    horarios: [
      { day: 0, dayLabel: 'Domingo', open: '00:00', close: '00:00', isClosed: true },
      { day: 1, dayLabel: 'Segunda', open: '00:00', close: '00:00', isClosed: true },
      { day: 2, dayLabel: 'Terça', open: '09:00', close: '18:00' },
      { day: 3, dayLabel: 'Quarta', open: '09:00', close: '18:00' },
      { day: 4, dayLabel: 'Quinta', open: '09:00', close: '18:00' },
      { day: 5, dayLabel: 'Sexta', open: '09:00', close: '18:00' },
      { day: 6, dayLabel: 'Sábado', open: '09:00', close: '14:00' },
    ],
    rating: 4.6,
    reviewsCount: 67,
    likesCount: 320,
    preco: 'gratis',
    duracao: '1-2 horas',
    dificuldade: 'facil',
    acessibilidade: ['Rampa de acesso', 'Elevador'],
    isDestaque: false,
    isVerificado: true,
    createdAt: '2024-01-08T09:00:00Z',
  },
];

// Mock reviews para demonstração
export const tourismReviewsMock: TourismReview[] = [
  {
    id: 'r1',
    spotId: '1',
    rating: 5,
    titulo: 'Melhor praia da região!',
    texto: 'Fomos em família e adoramos. A água é super calma, perfeita para as crianças. Os quiosques são bons e o pôr do sol é indescritível. Voltaremos com certeza!',
    fotos: ['https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=400'],
    autor: {
      id: 'u1',
      nome: 'Maria Silva',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100',
      reviewsCount: 23,
    },
    visitDate: '2024-01',
    likesCount: 45,
    liked: false,
    createdAt: '2024-01-15T10:30:00Z',
  },
  {
    id: 'r2',
    spotId: '1',
    rating: 4,
    titulo: 'Ótimo lugar, mas precisa de melhorias',
    texto: 'A praia é linda, mas senti falta de mais estrutura. Os banheiros públicos poderiam ser melhores. Tirando isso, é um ótimo passeio.',
    autor: {
      id: 'u2',
      nome: 'João Santos',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=100',
      reviewsCount: 8,
    },
    visitDate: '2024-01',
    likesCount: 12,
    liked: false,
    createdAt: '2024-01-20T14:00:00Z',
  },
  {
    id: 'r3',
    spotId: '1',
    rating: 5,
    texto: 'Stand up paddle aqui é sensacional! Águas super calmas e a vista é linda.',
    autor: {
      id: 'u3',
      nome: 'Pedro Costa',
      reviewsCount: 5,
    },
    visitDate: '2023-12',
    likesCount: 8,
    liked: false,
    createdAt: '2024-01-05T16:20:00Z',
  },
];
