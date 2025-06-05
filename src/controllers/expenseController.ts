import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  createExpenseSchema,
  updateExpenseSchema,
  paginationSchema,
  dateRangeSchema,
} from '../models/schemas.js';

// Get all expenses with optional filtering
export const getAllExpenses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and parse query parameters
    const { page, limit } = paginationSchema.parse(req.query);
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    const offset = (page - 1) * limit;
    const categoryId = req.query.category_id as string;

    // Get user ID from auth or request
    const userId = req.headers['user-id'] as string;

    // Start building the query
    let query = supabase
      .from('expenses')
      .select(
        `
        *,
        categories (name),
        budgets (name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('date', { ascending: false });

    // Apply date filters if provided
    if (start_date) {
      query = query.gte('date', start_date);
    }

    if (end_date) {
      query = query.lte('date', end_date);
    }

    // Filter by category if provided
    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: expenses, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    // Return paginated results
    return res.status(200).json({
      status: 'success',
      count,
      page,
      limit,
      data: expenses,
    });
  } catch (error) {
    return next(error);
  }
};

// Get expense by ID
export const getExpenseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    const { data: expense, error } = await supabase
      .from('expenses')
      .select(
        `
        *,
        categories (name),
        budgets (name)
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return next(new AppError('Expense not found', 404));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
};

// Create a new expense
export const createExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createExpenseSchema.parse(req.body);
    const userId = req.headers['user-id'] as string;

    // Check if the category exists
    const { data: _, error: categoryError } = await supabase
      .from('categories')
      .select('id')
      .eq('id', validatedData.category_id)
      .eq('user_id', userId)
      .single();

    if (categoryError) {
      return next(new AppError('Invalid category', 400));
    }

    // Check budget if provided
    if (validatedData.budget_id) {
      const { error: budgetError } = await supabase
        .from('budgets')
        .select('id')
        .eq('id', validatedData.budget_id)
        .eq('user_id', userId)
        .single();

      if (budgetError) {
        return next(new AppError('Invalid budget', 400));
      }
    }

    // Insert into database
    const { data: expense, error } = await supabase
      .from('expenses')
      .insert({ ...validatedData, user_id: userId })
      .select(
        `
        *,
        categories (name),
        budgets (name)
      `
      )
      .single();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(201).json({
      status: 'success',
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
};

// Update an expense
export const updateExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Validate request body
    const validatedData = updateExpenseSchema.parse(req.body);

    // Check if category_id is provided and valid
    if (validatedData.category_id) {
      const { error: categoryError } = await supabase
        .from('categories')
        .select('id')
        .eq('id', validatedData.category_id)
        .eq('user_id', userId)
        .single();

      if (categoryError) {
        return next(new AppError('Invalid category', 400));
      }
    }

    // Check if budget_id is provided and valid
    if (validatedData.budget_id) {
      const { error: budgetError } = await supabase
        .from('budgets')
        .select('id')
        .eq('id', validatedData.budget_id)
        .eq('user_id', userId)
        .single();

      if (budgetError) {
        return next(new AppError('Invalid budget', 400));
      }
    }

    // Update in database
    const { data: expense, error } = await supabase
      .from('expenses')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select(
        `
        *,
        categories (name),
        budgets (name)
      `
      )
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return next(new AppError('Expense not found', 404));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: expense,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete an expense
export const deleteExpense = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Delete from database
    const { error } = await supabase.from('expenses').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// Get expense summary (total by category for a date range)
export const getExpenseSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get date range from query params
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    const userId = req.headers['user-id'] as string;

    // Query to get summary
    const { data, error } = await supabase
      .from('expenses')
      .select(
        `
        amount,
        categories:category_id (id, name)
      `
      )
      .eq('user_id', userId)
      .gte(
        'date',
        start_date ||
          new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]
      )
      .lte('date', end_date || new Date().toISOString().split('T')[0]);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    // Process data to get summary by category
    const summary = data.reduce(
      (
        acc: Record<string, { id: string; name: string; total: number }>,
        item: { amount: number; categories: { id: string; name: string }[] }
      ) => {
        // Access first category from the array
        const categoryId = item.categories[0].id;
        const categoryName = item.categories[0].name;
        const amount = Number(item.amount);

        if (!acc[categoryId]) {
          acc[categoryId] = {
            id: categoryId,
            name: categoryName,
            total: 0,
          };
        }

        acc[categoryId].total += amount;

        return acc;
      },
      {}
    );

    // Convert to array and sort by total (descending)
    const result = Object.values(summary).sort((a, b) => b.total - a.total);

    return res.status(200).json({
      status: 'success',
      data: result,
    });
  } catch (error) {
    return next(error);
  }
};
