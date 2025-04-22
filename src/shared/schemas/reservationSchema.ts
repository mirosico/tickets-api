import { z } from 'zod';

export const reservationSchema = z.object({
  cartItemId: z.string(),
  userId: z.string(),
  reservedUntil: z.string().refine((date) => !isNaN(Date.parse(date)), {
    message: 'Invalid date format',
  }),
});

export type Reservation = z.infer<typeof reservationSchema>;
