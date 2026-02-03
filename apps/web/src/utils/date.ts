import { addDays, format, isSameDay as isSameDayFn, isWeekend as isWeekendFn, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import type { EventWithDates } from '@/types/events';

export const parseEventDate = (value: string | Date): Date =>
  value instanceof Date ? value : parseISO(value);

export const formatDayHeader = (date: Date): string => {
  const label = format(date, 'EEE, dd', { locale: ptBR });
  return label.charAt(0).toUpperCase() + label.slice(1);
};

export const formatDateLong = (date: Date): string =>
  format(date, "dd 'de' MMMM", { locale: ptBR });

export const formatDateShort = (date: Date): string =>
  format(date, 'dd MMM', { locale: ptBR });

export const formatTime = (date: Date): string => format(date, 'HH:mm');

export const formatTimeRange = (start: Date, end: Date): string =>
  `${formatTime(start)}–${formatTime(end)}`;

export const isSameDay = (a: Date, b: Date): boolean => isSameDayFn(a, b);

export const isToday = (date: Date): boolean => isSameDayFn(date, new Date());

export const isTomorrow = (date: Date): boolean => isSameDayFn(date, addDays(new Date(), 1));

export const isWeekend = (date: Date): boolean => isWeekendFn(date);

export const getDateKey = (date: Date): string => format(date, 'yyyy-MM-dd');

// Generic interface for events with date bounds
interface EventWithDateBounds {
  start: Date;
  end: Date;
}

export const getNextEvent = <T extends EventWithDateBounds>(events: T[], from = new Date()): T | null => {
  const upcoming = events
    .filter((event) => event.end >= from)
    .sort((a, b) => a.start.getTime() - b.start.getTime());
  return upcoming[0] ?? null;
};

export const getTimeOfDay = (date: Date): 'morning' | 'afternoon' | 'night' => {
  const hour = date.getHours();
  if (hour < 12) return 'morning';
  if (hour < 18) return 'afternoon';
  return 'night';
};
