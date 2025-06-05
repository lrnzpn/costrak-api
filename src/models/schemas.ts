import { z } from 'zod';

// Category schemas
export const categorySchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().max(500).optional(),
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createCategorySchema = categorySchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export const updateCategorySchema = createCategorySchema.partial();

export type Category = z.infer<typeof categorySchema>;
export type CreateCategoryInput = z.infer<typeof createCategorySchema>;
export type UpdateCategoryInput = z.infer<typeof updateCategorySchema>;

// Budget schemas
export const budgetSchema = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(1, 'Budget name is required').max(100),
    amount: z.number().nonnegative('Budget amount must be non-negative'),
    start_date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    }),
    end_date: z.string().refine(date => !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    }),
    category_id: z.string().uuid(),
    user_id: z.string().uuid().optional(),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .refine(
    data => {
      const startDate = new Date(data.start_date);
      const endDate = new Date(data.end_date);
      return endDate >= startDate;
    },
    {
      message: 'End date must be after start date',
      path: ['end_date'],
    }
  );

export const createBudgetSchema = budgetSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export const updateBudgetSchema = createBudgetSchema.partial();

export type Budget = z.infer<typeof budgetSchema>;
export type CreateBudgetInput = z.infer<typeof createBudgetSchema>;
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>;

// Expense schemas
export const expenseSchema = z.object({
  id: z.string().uuid().optional(),
  amount: z.number().nonnegative('Expense amount must be non-negative'),
  description: z.string().min(1, 'Description is required').max(255),
  date: z
    .string()
    .refine(date => !isNaN(Date.parse(date)), {
      message: 'Invalid date format',
    })
    .default(() => new Date().toISOString().split('T')[0]),
  category_id: z.string().uuid(),
  budget_id: z.string().uuid().optional(),
  user_id: z.string().uuid().optional(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const createExpenseSchema = expenseSchema.omit({
  id: true,
  user_id: true,
  created_at: true,
  updated_at: true,
});
export const updateExpenseSchema = createExpenseSchema.partial();

export type Expense = z.infer<typeof expenseSchema>;
export type CreateExpenseInput = z.infer<typeof createExpenseSchema>;
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>;

// Query params schemas
export const paginationSchema = z.object({
  page: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 1)),
  limit: z
    .string()
    .optional()
    .transform(val => (val ? parseInt(val, 10) : 10)),
});

export const dateRangeSchema = z.object({
  start_date: z
    .string()
    .optional()
    .refine(date => !date || !isNaN(Date.parse(date)), {
      message: 'Invalid start date format',
    }),
  end_date: z
    .string()
    .optional()
    .refine(date => !date || !isNaN(Date.parse(date)), {
      message: 'Invalid end date format',
    }),
});
