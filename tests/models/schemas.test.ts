import { describe, it, expect } from 'vitest';
import {
  categorySchema,
  createCategorySchema,
  budgetSchema,
  createBudgetSchema,
  expenseSchema,
  createExpenseSchema,
  paginationSchema,
  dateRangeSchema
} from '../../src/models/schemas';

describe('Category Schemas', () => {
  it('should validate a valid category', () => {
    const validCategory = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Groceries',
      description: 'Food and household items',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    expect(() => categorySchema.parse(validCategory)).not.toThrow();
  });

  it('should validate a valid create category input', () => {
    const validInput = {
      name: 'Groceries',
      description: 'Food and household items'
    };

    expect(() => createCategorySchema.parse(validInput)).not.toThrow();
  });

  it('should reject a category with empty name', () => {
    const invalidCategory = {
      name: '',
      description: 'Food and household items'
    };

    expect(() => createCategorySchema.parse(invalidCategory)).toThrow();
  });
});

describe('Budget Schemas', () => {
  it('should validate a valid budget', () => {
    const validBudget = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      name: 'Monthly Groceries',
      amount: 500,
      start_date: '2023-01-01',
      end_date: '2023-01-31',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    expect(() => budgetSchema.parse(validBudget)).not.toThrow();
  });

  it('should reject a budget with end_date before start_date', () => {
    const invalidBudget = {
      name: 'Monthly Groceries',
      amount: 500,
      start_date: '2023-02-01',
      end_date: '2023-01-31',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    expect(() => createBudgetSchema.parse(invalidBudget)).toThrow();
  });

  it('should reject a budget with negative amount', () => {
    const invalidBudget = {
      name: 'Monthly Groceries',
      amount: -500,
      start_date: '2023-01-01',
      end_date: '2023-01-31',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    expect(() => createBudgetSchema.parse(invalidBudget)).toThrow();
  });
});

describe('Expense Schemas', () => {
  it('should validate a valid expense', () => {
    const validExpense = {
      id: '123e4567-e89b-12d3-a456-426614174000',
      amount: 50.25,
      description: 'Grocery shopping',
      date: '2023-01-15',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
      budget_id: '123e4567-e89b-12d3-a456-426614174003',
      user_id: '123e4567-e89b-12d3-a456-426614174001',
      created_at: '2023-01-01T00:00:00Z',
      updated_at: '2023-01-01T00:00:00Z'
    };

    expect(() => expenseSchema.parse(validExpense)).not.toThrow();
  });

  it('should validate expense with default date', () => {
    const validExpense = {
      amount: 50.25,
      description: 'Grocery shopping',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    const parsed = createExpenseSchema.parse(validExpense);
    expect(parsed.date).toBeDefined();
  });

  it('should reject expense with negative amount', () => {
    const invalidExpense = {
      amount: -10,
      description: 'Grocery shopping',
      date: '2023-01-15',
      category_id: '123e4567-e89b-12d3-a456-426614174002',
    };

    expect(() => createExpenseSchema.parse(invalidExpense)).toThrow();
  });
});

describe('Query Parameter Schemas', () => {
  it('should parse pagination parameters', () => {
    const params = { page: '2', limit: '20' };
    const parsed = paginationSchema.parse(params);
    
    expect(parsed.page).toBe(2);
    expect(parsed.limit).toBe(20);
  });

  it('should provide default pagination values', () => {
    const params = {};
    const parsed = paginationSchema.parse(params);
    
    expect(parsed.page).toBe(1);
    expect(parsed.limit).toBe(10);
  });

  it('should validate date range parameters', () => {
    const validParams = { 
      start_date: '2023-01-01', 
      end_date: '2023-01-31' 
    };
    
    expect(() => dateRangeSchema.parse(validParams)).not.toThrow();
  });

  it('should reject invalid date format', () => {
    const invalidParams = { 
      start_date: 'not-a-date', 
      end_date: '2023-01-31' 
    };
    
    expect(() => dateRangeSchema.parse(invalidParams)).toThrow();
  });
});
