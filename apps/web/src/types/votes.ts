/**
 * Votações da Câmara - Type Definitions
 * Types for city council voting transparency module
 * Updated to match backend API structure
 */

// ==========================================
// Enums and Value Types
// ==========================================

export type VoteType = 'SIM' | 'NAO' | 'ABSTENCAO' | 'NAO_VOTOU';

export type VoteStatus = 'APROVADO' | 'REJEITADO' | 'EM_ANDAMENTO' | 'ARQUIVADO';

// ==========================================
// Partido (Political Party)
// ==========================================

export interface Partido {
  id: string;
  sigla: string;
  nome: string;
  corHex: string;
  logoUrl?: string;
}

// ==========================================
// Legislatura (Legislative Term)
// ==========================================

export interface Legislatura {
  id: string;
  numero: number;
  anoInicio: number;
  anoFim: number;
  atual: boolean;
  periodo: string;
  nomeCompleto: string;
}

// ==========================================
// Mandato (Councilor Term)
// ==========================================

export interface Mandato {
  id: string;
  cargo: string;
  inicio: string;
  fim?: string;
  emExercicio: boolean;
  partido: Partido;
  legislatura: Legislatura;
}

// ==========================================
// Vereador (Councilor)
// ==========================================

export interface VereadorList {
  id: string;
  nome: string;
  slug: string;
  fotoUrl?: string;
  ativo: boolean;
  partido?: {
    sigla: string;
    corHex: string;
  };
  cargo?: string;
  emExercicio: boolean;
}

export interface VereadorEstatisticas {
  totalVotos: number;
  votouSim: number;
  votouNao: number;
  abstencoes: number;
  ausencias: number;
  presencaPercent: number;
}

export interface VereadorFull {
  id: string;
  nome: string;
  slug: string;
  nascimento?: string;
  idade?: number;
  telefone?: string;
  email?: string;
  fotoUrl?: string;
  bio?: string;
  redesSociais?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
    whatsapp?: string;
    youtube?: string;
  };
  siteOficialUrl?: string;
  ativo: boolean;
  mandatoAtual?: Mandato;
  mandatos?: Mandato[];
  estatisticas?: VereadorEstatisticas;
}

// ==========================================
// Votação (Voting Session)
// ==========================================

export interface VoteCounts {
  sim: number;
  nao: number;
  abstencao: number;
  naoVotou: number;
}

export interface VotacaoList {
  id: string;
  protocolo?: string;
  titulo: string;
  subtitulo?: string;
  tipo: string;
  status: VoteStatus;
  statusLabel: string;
  data: string;
  tags: string[];
  counts: VoteCounts;
  resultado: 'approved' | 'rejected';
}

export interface VotoRegistro {
  id: string;
  voto: VoteType;
  votoLabel: string;
  votoColor: string;
  justificativa?: string;
  urlVideo?: string;
  vereador: VereadorList;
}

export interface VotacaoFull {
  id: string;
  protocolo?: string;
  titulo: string;
  subtitulo?: string;
  descricao?: string;
  ementa?: string;
  tipo: string;
  status: VoteStatus;
  statusLabel: string;
  statusColor: string;
  data: string;
  sessao?: string;
  urlFonte?: string;
  urlDocumento?: string;
  tags: string[];
  counts: VoteCounts;
  totalVotos: number;
  resultado: 'approved' | 'rejected';
  votos: VotoRegistro[];
}

// ==========================================
// Statistics
// ==========================================

export interface VotacoesStats {
  total: number;
  aprovadas: number;
  rejeitadas: number;
  emAndamento: number;
  taxaAprovacao: number;
  ultimaVotacao?: {
    id: string;
    titulo: string;
    data: string;
    status: VoteStatus;
  };
  porAno: Array<{
    ano: number;
    total: number;
  }>;
}

// ==========================================
// API Filters
// ==========================================

export interface VereadoresFilters {
  legislaturaAtual?: boolean;
  partido?: string;
  search?: string;
}

export interface VotacoesFilters {
  status?: VoteStatus | VoteStatus[];
  ano?: number;
  tipo?: string;
  vereador?: string;
  partido?: string;
  search?: string;
  perPage?: number;
  page?: number;
}

// ==========================================
// Legacy types (for backward compatibility)
// ==========================================

export interface VoteSource {
  label: string;
  url: string;
}

export interface Vote {
  id: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  source: VoteSource;
  counts: VoteCounts;
}

export interface Councilor {
  id: string;
  name: string;
  party: string;
  vote: VoteType;
  photoUrl: string;
  justification?: string;
  videoUrl?: string;
}

export interface VoteData {
  vote: Vote;
  councilors: Councilor[];
}

// ==========================================
// Vote History Types (for list page)
// ==========================================

export interface VoteHistoryItem {
  id: string;
  status: VoteStatus;
  date: string;
  title: string;
  summary: string;
  counts: VoteCounts;
  tags: string[];
}

export interface VotesHistoryData {
  meta: {
    city: string;
    lastUpdated: string;
  };
  votes: VoteHistoryItem[];
}

// ==========================================
// Vote display configuration
// ==========================================

export const VOTE_CONFIG: Record<
  VoteType,
  {
    label: string;
    color: string;
    bgColor: string;
    borderColor: string;
    icon: string;
    accentColor: string;
  }
> = {
  SIM: {
    label: 'Sim',
    color: 'text-green-600',
    bgColor: 'bg-green-500',
    borderColor: 'border-green-500/30',
    icon: 'check',
    accentColor: 'bg-green-400/60',
  },
  NAO: {
    label: 'Não',
    color: 'text-red-600',
    bgColor: 'bg-red-500',
    borderColor: 'border-red-500/30',
    icon: 'x',
    accentColor: 'bg-red-400/60',
  },
  ABSTENCAO: {
    label: 'Abstenção',
    color: 'text-amber-600',
    bgColor: 'bg-amber-500',
    borderColor: 'border-amber-500/30',
    icon: 'pause',
    accentColor: 'bg-amber-400/60',
  },
  NAO_VOTOU: {
    label: 'Ausente',
    color: 'text-gray-500',
    bgColor: 'bg-gray-400',
    borderColor: 'border-gray-300',
    icon: 'minus',
    accentColor: 'bg-gray-300/60',
  },
};

// Vote ordering priority (for sorting)
export const VOTE_ORDER: Record<VoteType, number> = {
  SIM: 1,
  NAO: 2,
  ABSTENCAO: 3,
  NAO_VOTOU: 4,
};

export const VOTE_STATUS_CONFIG: Record<
  VoteStatus,
  {
    label: string;
    bgColor: string;
    textColor: string;
    borderColor: string;
  }
> = {
  APROVADO: {
    label: 'Aprovado',
    bgColor: 'bg-green-100 dark:bg-green-900/30',
    textColor: 'text-green-700 dark:text-green-400',
    borderColor: 'border-green-200 dark:border-green-700',
  },
  REJEITADO: {
    label: 'Rejeitado',
    bgColor: 'bg-red-100 dark:bg-red-900/30',
    textColor: 'text-red-700 dark:text-red-400',
    borderColor: 'border-red-200 dark:border-red-700',
  },
  EM_ANDAMENTO: {
    label: 'Em Andamento',
    bgColor: 'bg-blue-100 dark:bg-blue-900/30',
    textColor: 'text-blue-700 dark:text-blue-400',
    borderColor: 'border-blue-200 dark:border-blue-700',
  },
  ARQUIVADO: {
    label: 'Arquivado',
    bgColor: 'bg-gray-100 dark:bg-gray-900/30',
    textColor: 'text-gray-700 dark:text-gray-400',
    borderColor: 'border-gray-200 dark:border-gray-700',
  },
};
