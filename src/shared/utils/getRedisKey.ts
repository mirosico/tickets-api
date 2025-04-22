const RESERVATION_PREFIX = 'reservation';

const TICKET_COUNT_PREFIX = 'concert:ticket_count';

export const getTicketCountKey = (concertId: string) =>
  `${TICKET_COUNT_PREFIX}:${concertId}`;

export const getReservationKey = (ticketId: string) =>
  `${RESERVATION_PREFIX}:${ticketId}`;

export const getReservationKeys = () => `${RESERVATION_PREFIX}:*`;

export const getLockKey = (ticketId: string) => `lock:ticket:${ticketId}`;
