import EventsPage from '@/pages/EventsPage';

interface AgendaScreenProps {
  scrollRef?: (el: HTMLDivElement | null) => void;
}

export default function AgendaScreen({ scrollRef }: AgendaScreenProps) {
  return <EventsPage scrollRef={scrollRef} />;
}
