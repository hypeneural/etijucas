// eTijucas Data Models

export interface Bairro {
  id: string;
  nome: string;
  slug?: string;
}

export type ReportCategory =
  | 'buraco'
  | 'iluminacao'
  | 'lixo'
  | 'transito'
  | 'barulho'
  | 'alagamento'
  | 'saude'
  | 'outros';

// Sync status for offline-first support
export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'error';

export interface Report {
  id: string;
  categoria: ReportCategory;
  subcategoria?: string; // New field
  texto: string;
  fotoUrl?: string; // Deprecated: use fotos[0]
  fotos: string[]; // New: Multiple photos support
  bairroId: string;
  endereco?: string; // New: Address
  referencia?: string; // New: Reference point
  latitude?: number;
  longitude?: number;
  status: 'recebido' | 'em_analise' | 'resolvido' | 'arquivado';
  createdAt: Date | string;
  updatedAt?: Date | string;

  // Stats & Interaction
  likes: number; // to be renamed to likesCount in V2, keeping for compat
  commentsCount?: number;
  liked?: boolean;

  protocolo: string;

  // Author info (optional for anonymous)
  user?: {
    id: string;
    nome: string;
    avatarUrl?: string;
  };

  // Offline-first fields
  syncStatus?: SyncStatus;
  tempId?: string;
  errorMessage?: string;
}

export type TopicCategory =
  | 'reclamacao'
  | 'sugestao'
  | 'duvida'
  | 'alerta'
  | 'elogio'
  | 'outros';

export type TopicStatus = 'active' | 'hidden' | 'deleted';

export interface TopicAutor {
  id: string | null;
  nome: string;
  avatarUrl: string | null;
}

export interface Topic {
  id: string;
  categoria: TopicCategory;
  categoriaLabel?: string;
  categoriaColor?: string;
  titulo: string;
  texto: string;
  fotoUrl?: string;
  isAnon: boolean;
  bairroId: string;
  likesCount: number;
  commentsCount: number;
  status?: TopicStatus;
  liked?: boolean | null;       // null = not authenticated
  isSaved?: boolean | null;     // null = not authenticated
  autor?: TopicAutor;
  bairro?: {
    id: string;
    nome: string;
  };
  createdAt: Date | string;
  updatedAt?: Date | string;
  // Offline-first fields
  syncStatus?: SyncStatus;
  tempId?: string;
  // Legacy field for backwards compat
  autorNome?: string;
}

export interface Comment {
  id: string;
  topicId: string;
  parentId?: string | null;
  texto: string;
  imageUrl?: string;
  isAnon: boolean;
  likesCount?: number;
  liked?: boolean | null;       // null = not authenticated
  depth?: number;
  autor?: TopicAutor;
  replies?: Comment[];
  repliesCount?: number;
  createdAt: Date | string;
  updatedAt?: Date | string;
  // Legacy field for backwards compat
  autorNome?: string;
  fotoUrl?: string;
}


export interface Event {
  id: string;
  titulo: string;
  descricao?: string;
  dateTime: Date;
  local: string;
  bairroId: string;
  tags: string[];
  imageUrl?: string;
}

export interface TourismSpot {
  id: string;
  titulo: string;
  descCurta: string;
  descLonga?: string;
  tags: string[];
  imageUrl?: string;
  endereco?: string;
}

export interface MassSchedule {
  id: string;
  bairroId: string;
  igrejaNome: string;
  diaSemana: number; // 0-6, 0 = domingo
  horarios: string[];
}

export type PhoneCategory =
  | 'emergencias'
  | 'seguranca'
  | 'saude'
  | 'prefeitura'
  | 'educacao'
  | 'utilidades'
  | 'turismo'
  | 'defesa_civil'
  | 'servicos'
  | 'outros';

export interface UsefulPhone {
  id: string;
  categoria: PhoneCategory;
  nome: string;
  numero: string;
  descricao?: string;
  isPinned?: boolean;
}

// New enhanced phone contact type
export interface PhoneContact {
  id: string;
  name: string;
  category: PhoneCategory;
  subcategory?: string;
  phone: string;
  phone_display?: string;
  whatsapp?: string | null;
  description?: string | null;
  hours?: string | null;
  is_emergency?: boolean;
  is_free?: boolean;
  address?: string | null;
  neighborhood?: string | null;
  lat?: number | null;
  lng?: number | null;
  tags?: string[];
  priority?: number;
  updated_at?: string;
}

export interface Alert {
  id: string;
  titulo: string;
  tipo: 'obras' | 'interdicao' | 'evento' | 'clima';
  descricao: string;
  bairroId?: string;
  severity?: 'info' | 'warning' | 'danger';
  expiresAt?: Date;
  createdAt: Date;
}
