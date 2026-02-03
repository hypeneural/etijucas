import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import type { EventWithDates } from '@/types/events';

interface TicketCTAProps {
  event: EventWithDates;
}

export default function TicketCTA({ event }: TicketCTAProps) {
  const isFree = event.ticket?.type === 'free';
  const label = isFree ? 'Confirmar presença' : 'Ingressos';

  const handleClick = () => {
    if (event.ticket?.purchaseUrl) {
      window.open(event.ticket.purchaseUrl, '_blank');
    }
  };

  return (
    <motion.div
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="fixed bottom-0 left-1/2 z-40 w-full max-w-[420px] -translate-x-1/2 border-t bg-background/95 px-4 py-4 backdrop-blur"
    >
      <Button className="w-full" onClick={handleClick}>
        {label}
      </Button>
    </motion.div>
  );
}
