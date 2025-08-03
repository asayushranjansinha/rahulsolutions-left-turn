import { z } from 'zod';

export const authSchema = z.object({
  phoneNumber: z
    .string()
    .regex(/^[6-9]\d{9}$/, { message: 'Invalid Indian phone number' }),

  expoPushToken: z
    .string()
    .regex(/^ExpoPushToken\[(.+)\]$/, { message: 'Invalid Expo push token' }),
});
