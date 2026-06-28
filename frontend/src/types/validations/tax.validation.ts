import { z } from 'zod';

export const taxSchema = z.object({
  id: z.number().optional(),
  label: z.string().min(3, { message: 'label_length_error' }),
  value: z.number().min(0, { message: 'value_interval_error' }),
  isRate: z.boolean().optional(),
  isSpecial: z.boolean().optional(),
  currencyId: z.number().nullable().optional()
});

export const createTaxSchema = taxSchema.omit({
  id: true
});

export const updateTaxSchema = taxSchema.partial();
