import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/db.js';
import { AppError } from '../middlewares/errorHandler.js';
import { createCategorySchema, updateCategorySchema, paginationSchema } from '../models/schemas.js';

// Get all categories
export const getAllCategories = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate and parse query parameters
    const { page, limit } = paginationSchema.parse(req.query);
    const offset = (page - 1) * limit;

    // Get user ID from auth or request
    const userId = req.headers['user-id'] as string;

    // Query categories
    const {
      data: categories,
      error,
      count,
    } = await supabase
      .from('categories')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('name', { ascending: true })
      .range(offset, offset + limit - 1);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    // Return paginated results
    return res.status(200).json({
      status: 'success',
      count,
      page,
      limit,
      data: categories,
    });
  } catch (error) {
    return next(error);
  }
};

// Get a specific category by ID
export const getCategoryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    const { data: category, error } = await supabase
      .from('categories')
      .select('*')
      .eq('id', id)
      .eq('user_id', userId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return next(new AppError('Category not found', 404));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

// Create a new category
export const createCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Validate request body
    const validatedData = createCategorySchema.parse(req.body);
    const userId = req.headers['user-id'] as string;

    // Insert into database
    const { data: category, error } = await supabase
      .from('categories')
      .insert({ ...validatedData, user_id: userId })
      .select()
      .single();

    if (error) {
      if (error.code === '23505') {
        // Unique violation
        return next(new AppError('A category with this name already exists', 409));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(201).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

// Update a category
export const updateCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Validate request body
    const validatedData = updateCategorySchema.parse(req.body);

    // Update in database
    const { data: category, error } = await supabase
      .from('categories')
      .update(validatedData)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found or no rows updated
        return next(new AppError('Category not found', 404));
      } else if (error.code === '23505') {
        // Unique violation
        return next(new AppError('A category with this name already exists', 409));
      }
      return next(new AppError(error.message, 500));
    }

    return res.status(200).json({
      status: 'success',
      data: category,
    });
  } catch (error) {
    return next(error);
  }
};

// Delete a category
export const deleteCategory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const userId = req.headers['user-id'] as string;

    // Delete from database
    const { error } = await supabase.from('categories').delete().eq('id', id).eq('user_id', userId);

    if (error) {
      return next(new AppError(error.message, 500));
    }

    return res.status(204).send();
  } catch (error) {
    return next(error);
  }
};
