import { Request, Response, NextFunction } from 'express';
import { AnyZodObject } from 'zod';

/**
 * Middleware factory for validating request data against Zod schemas
 * @param schema - The Zod schema to validate against
 * @param source - The part of the request to validate ('body', 'params', or 'query')
 */
export const validate = (schema: AnyZodObject, source: 'body' | 'params' | 'query' = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Parse and validate the request data against the provided schema
      const data = await schema.parseAsync(req[source]);

      // Replace the request data with the validated data
      req[source] = data;

      next();
    } catch (error) {
      // Pass Zod errors to the error handler
      next(error);
    }
  };
};
