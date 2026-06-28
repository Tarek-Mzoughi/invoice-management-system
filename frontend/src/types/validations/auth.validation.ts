import { z } from 'zod';

export const LoginSchema = z.object({
  usernameOrEmail: z.string().email({ message: 'Invalid email format' }),
  password: z.string().min(1, { message: 'Invalid password' })
});

export const RegisterSchema = z
  .object({
    username: z.string().min(1, { message: 'Invalid username' }),
    email: z.string().email({ message: 'Invalid email format' }),
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' })
      .max(64, { message: 'Password must be at most 64 characters long' })
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z\d]).+$/, {
        message:
          'Password must include uppercase, lowercase, number, and special character'
      }),
    confirmPassword: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });
