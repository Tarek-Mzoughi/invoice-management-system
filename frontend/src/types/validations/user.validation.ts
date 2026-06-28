import { z } from 'zod';

const baseUserSchema = z.object({
  username: z
    .string()
    .regex(/^[a-zA-Z0-9_]+$/, {
      message: 'Invalid Username, it must contain only letters, numbers, or underscores'
    })
    .min(3, {
      message: 'Invalid Username, must be at least 3 characters long'
    }),
  email: z.string().email({ message: 'Invalid E-mail' }),

  firstName: z
    .string()
    .min(3, { message: 'Invalid Firstname, must be at least 3 characters' })
    .max(25, { message: 'Firstname must not exceed 25 characters' })
    .regex(/^[a-zA-Z\s]+$/, {
      message: 'Firstname must contain only letters and spaces'
    }),
  lastName: z
    .string()
    .min(3, { message: 'Invalid Lastname, must be at least 3 characters' })
    .max(25, { message: 'Lastname must not exceed 25 characters' })
    .regex(/^[a-zA-Z\s]+$/, {
      message: 'Lastname must contain only letters and spaces'
    }),
  dateOfBirth: z.string().refine(
    (date) => {
      const birthDate = new Date(date);
      const today = new Date();

      const age = today.getFullYear() - birthDate.getFullYear();
      const isBirthdayPassed =
        today.getMonth() > birthDate.getMonth() ||
        (today.getMonth() === birthDate.getMonth() && today.getDate() >= birthDate.getDate());

      return age > 13 || (age === 13 && isBirthdayPassed);
    },
    {
      message: 'User must be at least 13 years old'
    }
  ),
  roleId: z.number({ message: 'Please select a role' })
});

const createUserSchema = baseUserSchema
  .extend({
    password: z.string().min(8, { message: 'Password must be at least 8 characters long' }),
    confirmPassword: z.string().optional()
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

// Helper function for password validation
const isPasswordValid = (data: { password?: string; confirmPassword?: string }) => {
  if (!data.password) return true; // Skip validation if password is not provided
  return data.password === data.confirmPassword; // Validate only if password is provided
};

const updateUserSchema = baseUserSchema
  .extend({
    password: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters long' }) // Apply constraints first
      .optional(), // Then make it optional
    confirmPassword: z.string().optional()
  })
  .refine(isPasswordValid, {
    message: 'Passwords do not match',
    path: ['confirmPassword']
  });

export { baseUserSchema, createUserSchema, updateUserSchema };
