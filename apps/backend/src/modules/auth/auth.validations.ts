import { z } from 'zod';

export const authSchema = z.object({
  phoneNumber: z.string(),

  expoPushToken: z
    .string()
    .regex(/^ExpoPushToken\[(.+)\]$/, { message: 'Invalid Expo push token' }),
});
