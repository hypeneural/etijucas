/**
 * @fileoverview Mock Data for Development
 * 
 * @deprecated This file will be removed when API integration is complete.
 * 
 * MIGRATION STATUS:
 * - bairros: ✅ Moved to constants/bairros.ts
 * - topics: ⚠️ Use useOfflineTopics hook (IndexedDB backed)
 * - reports: ⚠️ Use useOfflineReports hook (IndexedDB backed)
 * - events: TODO - Will be moved to IndexedDB
 * - phones: TODO - Will be moved to IndexedDB
 * - masses: TODO - Will be moved to IndexedDB
 * - tourism: TODO - Will be moved to IndexedDB
 * - alerts: TODO - Will be moved to IndexedDB
 * 
 * DO NOT add new mock data here. Instead:
 * 1. Create IndexedDB store in lib/localDatabase.ts
 * 2. Create offline-first hook in hooks/
 * 3. Use API with fallback to IndexedDB
 */

import {
  Bairro,
  Topic,
  Event,
  TourismSpot,
  MassSchedule,
  UsefulPhone,
  Alert,
  Report
} from '@/types';

export const bairros: Bairro[] = [
  { id: '1', nome: 'Centro' },
  { id: '2', nome: 'Praça' },
  { id: '3', nome: 'São Vicente' },
  { id: '4', nome: 'Areias' },
  { id: '5', nome: 'Cordeiros' },
  { id: '6', nome: 'Murta' },
  { id: '7', nome: 'Itapema do Norte' },
  { id: '8', nome: 'Rio do Meio' },
];

export const initialTopics: Topic[] = [
  {
    id: '1',
    categoria: 'reclamacao',
    titulo: 'Buraco enorme na Rua XV de Novembro há 3 meses!',
    texto: 'Já reportei várias vezes e nada foi feito. O buraco está crescendo e já causou acidentes.',
    isAnon: false,
    autorNome: 'Carlos M.',
    bairroId: '1',
    likesCount: 47,
    commentsCount: 12,
    createdAt: new Date('2024-01-25T10:30:00'),
    liked: false,
  },
  {
    id: '2',
    categoria: 'alerta',
    titulo: 'Cuidado! Poste com fiação exposta perto da escola',
    texto: 'Na Rua das Flores, próximo à escola municipal, tem um poste com fios soltos. Muito perigoso para as crianças.',
    fotoUrl: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400',
    isAnon: true,
    bairroId: '3',
    likesCount: 35,
    commentsCount: 8,
    createdAt: new Date('2024-01-26T14:15:00'),
    liked: false,
  },
  {
    id: '3',
    categoria: 'sugestao',
    titulo: 'Precisamos de mais lixeiras na praça central',
    texto: 'A praça está sempre cheia de lixo. Se tivesse mais lixeiras, o pessoal descartaria corretamente.',
    isAnon: false,
    autorNome: 'Ana Paula',
    bairroId: '2',
    likesCount: 28,
    commentsCount: 5,
    createdAt: new Date('2024-01-26T09:00:00'),
    liked: false,
  },
  {
    id: '4',
    categoria: 'elogio',
    titulo: 'Parabéns pela reforma da praça do bairro!',
    texto: 'Ficou linda a praça de Areias! As crianças estão adorando os novos brinquedos.',
    fotoUrl: 'https://images.unsplash.com/photo-1568393691622-c7ba131d63b4?w=400',
    isAnon: false,
    autorNome: 'Roberto',
    bairroId: '4',
    likesCount: 52,
    commentsCount: 15,
    createdAt: new Date('2024-01-24T16:45:00'),
    liked: false,
  },
  {
    id: '5',
    categoria: 'duvida',
    titulo: 'Alguém sabe o horário do ônibus para Itapema?',
    texto: 'Preciso ir ao médico em Itapema amanhã cedo. Qual o primeiro horário?',
    isAnon: false,
    autorNome: 'Maria José',
    bairroId: '1',
    likesCount: 8,
    commentsCount: 4,
    createdAt: new Date('2024-01-27T08:30:00'),
    liked: false,
  },
  {
    id: '6',
    categoria: 'reclamacao',
    titulo: 'Som alto toda noite no bar da esquina',
    texto: 'Não consigo dormir há semanas. O bar funciona até 3h da manhã com som altíssimo.',
    isAnon: true,
    bairroId: '5',
    likesCount: 19,
    commentsCount: 7,
    createdAt: new Date('2024-01-26T23:00:00'),
    liked: false,
  },
];

export const events: Event[] = [
  {
    id: '1',
    titulo: 'Feira de Artesanato',
    descricao: 'Venha conhecer o trabalho dos artesãos locais com produtos únicos.',
    dateTime: new Date('2024-01-27T09:00:00'),
    local: 'Praça Central',
    bairroId: '2',
    tags: ['cultura', 'artesanato', 'família'],
  },
  {
    id: '2',
    titulo: 'Show de MPB ao Vivo',
    descricao: 'Apresentação da banda Raízes do Vale com clássicos da MPB.',
    dateTime: new Date('2024-01-27T20:00:00'),
    local: 'Anfiteatro Municipal',
    bairroId: '1',
    tags: ['música', 'cultura'],
  },
  {
    id: '3',
    titulo: 'Campeonato de Futsal',
    descricao: 'Final do campeonato municipal de futsal entre os bairros.',
    dateTime: new Date('2024-01-28T15:00:00'),
    local: 'Ginásio Municipal',
    bairroId: '1',
    tags: ['esporte', 'comunidade'],
  },
  {
    id: '4',
    titulo: 'Mutirão de Limpeza do Rio',
    descricao: 'Ação voluntária para limpeza das margens do Rio Tijucas.',
    dateTime: new Date('2024-01-29T08:00:00'),
    local: 'Margem do Rio - Centro',
    bairroId: '1',
    tags: ['meio ambiente', 'voluntariado'],
  },
];

export const tourismSpots: TourismSpot[] = [
  {
    id: '1',
    titulo: 'Praia de Tijucas',
    descCurta: 'Praia tranquila com águas calmas, perfeita para famílias.',
    descLonga: 'Uma das praias mais tranquilas da região, com águas calmas ideais para banho de crianças.',
    tags: ['natureza', 'família', 'praia'],
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=600',
  },
  {
    id: '2',
    titulo: 'Igreja Matriz',
    descCurta: 'Igreja histórica do século XIX no coração da cidade.',
    tags: ['cultura', 'história', 'arquitetura'],
    imageUrl: 'https://images.unsplash.com/photo-1548625149-fc4a29cf7092?w=600',
  },
  {
    id: '3',
    titulo: 'Trilha do Morro',
    descCurta: 'Trilha com vista panorâmica da cidade e do vale.',
    tags: ['natureza', 'aventura', 'esporte'],
    imageUrl: 'https://images.unsplash.com/photo-1551632811-561732d1e306?w=600',
  },
  {
    id: '4',
    titulo: 'Mercado Municipal',
    descCurta: 'Produtos locais, artesanato e gastronomia típica.',
    tags: ['cultura', 'gastronomia', 'compras'],
    imageUrl: 'https://images.unsplash.com/photo-1488459716781-31db52582fe9?w=600',
  },
];

export const massSchedules: MassSchedule[] = [
  {
    id: '1',
    bairroId: '1',
    igrejaNome: 'Igreja Matriz São Sebastião',
    diaSemana: 0,
    horarios: ['07:00', '09:00', '19:00'],
  },
  {
    id: '2',
    bairroId: '1',
    igrejaNome: 'Igreja Matriz São Sebastião',
    diaSemana: 6,
    horarios: ['18:00'],
  },
  {
    id: '3',
    bairroId: '3',
    igrejaNome: 'Capela São Vicente',
    diaSemana: 0,
    horarios: ['08:00', '17:00'],
  },
  {
    id: '4',
    bairroId: '4',
    igrejaNome: 'Igreja Nossa Senhora de Fátima',
    diaSemana: 0,
    horarios: ['09:30', '18:30'],
  },
  {
    id: '5',
    bairroId: '2',
    igrejaNome: 'Igreja do Sagrado Coração',
    diaSemana: 0,
    horarios: ['10:00', '19:00'],
  },
];

export const usefulPhones: UsefulPhone[] = [
  { id: '1', categoria: 'emergencias', nome: 'SAMU', numero: '192', descricao: 'Emergências médicas' },
  { id: '2', categoria: 'emergencias', nome: 'Bombeiros', numero: '193', descricao: 'Incêndios e resgates' },
  { id: '3', categoria: 'emergencias', nome: 'Polícia Militar', numero: '190', descricao: 'Ocorrências policiais' },
  { id: '4', categoria: 'emergencias', nome: 'Polícia Civil', numero: '(47) 3263-0190', descricao: 'Delegacia de Tijucas' },
  { id: '5', categoria: 'prefeitura', nome: 'Prefeitura Municipal', numero: '(47) 3263-8000', descricao: 'Central de atendimento' },
  { id: '6', categoria: 'prefeitura', nome: 'Ouvidoria', numero: '0800 123 4567', descricao: 'Reclamações e sugestões' },
  { id: '7', categoria: 'saude', nome: 'UPA 24h', numero: '(47) 3263-5000', descricao: 'Pronto atendimento' },
  { id: '8', categoria: 'saude', nome: 'Posto de Saúde Centro', numero: '(47) 3263-5100', descricao: 'Agendamentos e consultas' },
  { id: '9', categoria: 'defesa_civil', nome: 'Defesa Civil', numero: '199', descricao: 'Emergências climáticas' },
  { id: '10', categoria: 'servicos', nome: 'Água e Esgoto', numero: '0800 048 1195', descricao: 'Casan - falta d\'água' },
  { id: '11', categoria: 'servicos', nome: 'Energia Elétrica', numero: '0800 048 0196', descricao: 'Celesc - falta de luz' },
];

export const alerts: Alert[] = [
  {
    id: '1',
    titulo: 'Obras na Rua Principal',
    tipo: 'obras',
    descricao: 'Interdição parcial da Rua XV de Novembro até 30/01',
    bairroId: '1',
    createdAt: new Date('2024-01-25'),
  },
  {
    id: '2',
    titulo: 'Alerta de Chuva Forte',
    tipo: 'clima',
    descricao: 'Previsão de chuvas intensas para hoje à noite',
    createdAt: new Date('2024-01-27'),
  },
];

export const myReports: Report[] = [
  {
    id: '1',
    categoria: 'buraco',
    texto: 'Buraco grande na Rua das Palmeiras, próximo ao número 150.',
    bairroId: '1',
    status: 'em_analise',
    createdAt: new Date('2024-01-20'),
    likes: 5,
    protocolo: 'ETJ-000089',
    fotos: [],
  },
  {
    id: '2',
    categoria: 'iluminacao',
    texto: 'Poste apagado há uma semana na esquina da Rua XV com Rua das Flores.',
    bairroId: '1',
    status: 'recebido',
    createdAt: new Date('2024-01-26'),
    likes: 2,
    protocolo: 'ETJ-000123',
    fotos: [],
  },
];
