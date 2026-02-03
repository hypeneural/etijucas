// ======================================================
// Tourism Types - Pontos Turísticos (TripAdvisor-like)
// ======================================================

export type TourismCategory =
  | 'natureza'
  | 'cultura'
  | 'historia'
  | 'gastronomia'
  | 'aventura'
  | 'praia'
  | 'religioso'
  | 'familia'
  | 'compras'
  | 'lazer';

export const TOURISM_CATEGORIES: Record<TourismCategory, { label: string; icon: string; color: string }> = {
  natureza: { label: 'Natureza', icon: '🌿', color: 'bg-green-100 text-green-700' },
  cultura: { label: 'Cultura', icon: '🎭', color: 'bg-purple-100 text-purple-700' },
  historia: { label: 'História', icon: '🏛️', color: 'bg-amber-100 text-amber-700' },
  gastronomia: { label: 'Gastronomia', icon: '🍽️', color: 'bg-orange-100 text-orange-700' },
  aventura: { label: 'Aventura', icon: '🧗', color: 'bg-red-100 text-red-700' },
  praia: { label: 'Praia', icon: '🏖️', color: 'bg-cyan-100 text-cyan-700' },
  religioso: { label: 'Religioso', icon: '⛪', color: 'bg-indigo-100 text-indigo-700' },
  familia: { label: 'Família', icon: '👨‍👩‍👧‍👦', color: 'bg-pink-100 text-pink-700' },
  compras: { label: 'Compras', icon: '🛍️', color: 'bg-rose-100 text-rose-700' },
  lazer: { label: 'Lazer', icon: '🎡', color: 'bg-teal-100 text-teal-700' },
};

export interface TourismMedia {
  id: string;
  type: 'image' | 'video';
  url: string;
  thumbnailUrl?: string;
  caption?: string;
  uploadedBy?: string;
  createdAt?: string;
}

export interface TourismReview {
  id: string;
  spotId: string;
  rating: number; // 1-5
  titulo?: string;
  texto: string;
  fotos?: string[];
  autor: {
    id: string;
    nome: string;
    avatarUrl?: string;
    reviewsCount?: number;
  };
  visitDate?: string;
  likesCount: number;
  liked?: boolean;
  createdAt: string;
  updatedAt?: string;
}

export interface TourismOpeningHours {
  day: number; // 0-6, 0 = domingo
  dayLabel: string;
  open: string;
  close: string;
  isClosed?: boolean;
}

export interface TourismSpotEnhanced {
  id: string;
  titulo: string;
  descCurta: string;
  descLonga?: string;
  
  // Categorização
  categoria: TourismCategory;
  tags: string[];
  
  // Mídia
  imageUrl: string; // imagem principal
  gallery: TourismMedia[];
  videoUrl?: string; // vídeo destaque
  
  // Localização
  endereco: string;
  bairroId: string;
  bairroNome?: string;
  latitude?: number;
  longitude?: number;
  comoChegar?: string;
  
  // Horários e Contato
  horarios?: TourismOpeningHours[];
  telefone?: string;
  whatsapp?: string;
  website?: string;
  instagram?: string;
  
  // Avaliações
  rating: number; // média 1-5
  reviewsCount: number;
  reviews?: TourismReview[];
  
  // Interações
  likesCount: number;
  liked?: boolean;
  isSaved?: boolean;
  viewsCount?: number;
  
  // Informações adicionais
  preco?: 'gratis' | 'barato' | 'moderado' | 'caro';
  duracao?: string; // ex: "1-2 horas"
  dificuldade?: 'facil' | 'moderada' | 'dificil';
  acessibilidade?: string[];
  dicasVisita?: string[];
  
  // Metadata
  isDestaque?: boolean;
  isVerificado?: boolean;
  createdAt: string;
  updatedAt?: string;
}

// Filtros para listagem
export interface TourismFilters {
  categoria?: TourismCategory;
  tags?: string[];
  bairroId?: string;
  preco?: string;
  rating?: number; // mínimo
  search?: string;
  sortBy?: 'rating' | 'reviews' | 'recent' | 'popular';
}

// Sort options
export const TOURISM_SORT_OPTIONS = [
  { value: 'rating', label: 'Mais bem avaliados' },
  { value: 'reviews', label: 'Mais comentados' },
  { value: 'popular', label: 'Mais populares' },
  { value: 'recent', label: 'Adicionados recentemente' },
] as const;

// Price labels
export const PRECO_LABELS: Record<string, { label: string; icon: string }> = {
  gratis: { label: 'Gratuito', icon: '🆓' },
  barato: { label: '$', icon: '💵' },
  moderado: { label: '$$', icon: '💵💵' },
  caro: { label: '$$$', icon: '💵💵💵' },
};
