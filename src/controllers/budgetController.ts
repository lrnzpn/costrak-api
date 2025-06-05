import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';
import {
  createBudgetSchema,
  updateBudgetSchema,
  paginationSchema,
  dateRangeSchema,
} from '../models/schemas.js';

// Get all budgets with optional filtering
export const getAllBudgets = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and parse query parameters
    const { page, limit } = paginationSchema.parse(req.query);
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get user ID from auth or request
    const userId = req.headers['user-id'] as string;

    // Start building the query
    let query = supabase
      .from('budgets')
      .select(
        `
        *,
        categories (name)
      `,
        { count: 'exact' }
      )
      .eq('user_id', userId)
      .order('start_date', { ascending: false });

    // Apply date filters if provided
    if (start_date) {
      query = query.gte('start_date', start_date);
    }

    if (end_date) {
      query = query.lte('end_date', end_date);
    }

    // Apply pagination
    query = query.range(offset, offset + limit - 1);

    // Execute query
    const { data: budgets, error, count } = await query;

    if (error) {
      return next(new AppError(error.message, 500));
    }

    // Return paginated results
    return res.status(200).json({
      status: 'success',
      count,
      page,
      limit,
      data: budgets,
    });
  } catch (error) {
    return next(error);
  }
};

// Get a specific budget by ID
export const getBudgetById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Query the budget with category details
    const { data: budget, error } = await supabase
      .from('budgets')
      .select(
        `
        *,
        categories (name)
      `
      )
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return next(new AppError('Budget not found', 404));
      }
      return next(new AppError(error.message, 500));
    }

    // Get expenses for this budget
    const { data: expenses, error: expensesError } = await supabase
      .from('expenses')
      .select('*')
      .eq('budget_id', id)
      .eq('user_id', userId);

    if (expensesError) {
      return next(new AppError(expensesError.message, 500));
    }

    // Calculate total spent
    const totalSpent = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;

    return res.status(200).json({
      status: 'success',
      data: {
        ...budget,
        total_spent: totalSpent,
        remaining: Number(budget.amount) - totalSpent,
        expenses,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// Create a new budget
export const createBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createBudgetSchema.parse(req.body);
    const userId = req.headers['user-id'] as string;

    // Insert into database
    const { data: budget, error } = await supabase
      .from('budgets')
      .insert({ ...validatedData, user_id: userId })
      .select()
      .single();

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(201).json({
      status: 'success',
      data: budget,
    });
  } catch (error) {
    return next(error);
  }
};

// Update a budget
export const updateBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Validate request body
    const validatedData = updateBudgetSchema.parse(req.body);

    // Update in database
    const { data: budget, error } = await supabase
      .from('budgets')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return next(new AppError('Budget not found', 404));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: budget,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete a budget
export const deleteBudget = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Delete from database
    const { error } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};

// Get budget summary (spend by category)
export const getBudgetSummary = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Get date range from query params
    const { start_date, end_date } = dateRangeSchema.parse(req.query);
    const userId = req.headers['user-id'] as string;

    // Use the database function for summary
    const { data: summary, error } = await supabase.rpc('get_budget_summary', {
      user_uuid: userId,
      period_start: start_date || new Date().toISOString().split('T')[0],
      period_end: end_date || new Date().toISOString().split('T')[0],
    });

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: summary,
    });
  } catch (error) {
    return next(error);
  }
};
