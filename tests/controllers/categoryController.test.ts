import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../../src/controllers/categoryController';
import { supabase } from '../../src/config/db';

// Mock the supabase client
vi.mock('../../src/config/db', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
  },
}));

describe('CategoryController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;
  
  beforeEach(() => {
    mockRequest = {
      params: {},
      body: {},
      headers: { 'user-id': '123e4567-e89b-12d3-a456-426614174001' },
      query: {},
    };
    
    mockResponse = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
      send: vi.fn(),
    };
    
    mockNext = vi.fn();
  });
  
  describe('getAllCategories', () => {
    it('should get all categories successfully', async () => {
      const mockCategories = [
        { id: '1', name: 'Food' },
        { id: '2', name: 'Transport' }
      ];
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockCategories,
          error: null,
          count: 2
        })
      } as any);
      
      await getAllCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        count: 2,
        page: 1,
        limit: 10,
        data: mockCategories,
      });
    });
    
    it('should handle database errors', async () => {
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: null,
          error: { message: 'Database error' },
          count: 0
        })
      } as any);
      
      await getAllCategories(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.message).toEqual('Database error');
    });
  });
  
  describe('getCategoryById', () => {
    it('should get a category by ID successfully', async () => {
      mockRequest.params = { id: '1' };
      const mockCategory = { id: '1', name: 'Food' };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCategory,
          error: null
        })
      } as any);
      
      await getCategoryById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCategory,
      });
    });
    
    it('should handle not found error', async () => {
      mockRequest.params = { id: 'non-existent' };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: 'PGRST116', message: 'Not found' }
        })
      } as any);
      
      await getCategoryById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toEqual(404);
    });
  });
  
  describe('createCategory', () => {
    it('should create a category successfully', async () => {
      const categoryData = { name: 'Entertainment', description: 'Movies, games, etc.' };
      mockRequest.body = categoryData;
      
      const mockCategory = {
        id: '123',
        ...categoryData,
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCategory,
          error: null
        })
      } as any);
      
      await createCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCategory,
      });
    });
    
    it('should handle duplicate name error', async () => {
      mockRequest.body = { name: 'Existing Category' };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: null,
          error: { code: '23505', message: 'duplicate key value violates unique constraint' }
        })
      } as any);
      
      await createCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toEqual(409);
    });
  });
  
  describe('updateCategory', () => {
    it('should update a category successfully', async () => {
      mockRequest.params = { id: '123' };
      mockRequest.body = { name: 'Updated Category' };
      
      const mockCategory = {
        id: '123',
        name: 'Updated Category',
        user_id: '123e4567-e89b-12d3-a456-426614174001',
      };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        update: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockCategory,
          error: null
        })
      } as any);
      
      await updateCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockCategory,
      });
    });
  });
  
  describe('deleteCategory', () => {
    it('should delete a category successfully', async () => {
      mockRequest.params = { id: '123' };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        delete: vi.fn().mockReturnThis(),
        eq: vi.fn().mockResolvedValue({
          error: null
        })
      } as any);
      
      await deleteCategory(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(204);
    });
  });
});
