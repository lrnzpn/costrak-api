import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Request, Response, NextFunction } from 'express';
import { 
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
} from '../../src/controllers/budgetController';
import { supabase } from '../../src/config/db';

// Mock the supabase client
vi.mock('../../src/config/db', () => ({
  supabase: {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    gte: vi.fn().mockReturnThis(),
    lte: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
    rpc: vi.fn().mockReturnThis(),
  },
}));

describe('BudgetController', () => {
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
  
  describe('getAllBudgets', () => {
    it('should get all budgets successfully', async () => {
      const mockBudgets = [
        { 
          id: '1', 
          name: 'Monthly Groceries',
          amount: 500,
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          categories: { name: 'Food' }
        },
        { 
          id: '2', 
          name: 'Transportation',
          amount: 200,
          start_date: '2023-01-01',
          end_date: '2023-01-31',
          categories: { name: 'Transport' }
        }
      ];
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        order: vi.fn().mockReturnThis(),
        range: vi.fn().mockResolvedValue({
          data: mockBudgets,
          error: null,
          count: 2
        })
      } as any);
      
      await getAllBudgets(
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
        data: mockBudgets,
      });
    });
    
    it('should apply date filters when provided', async () => {
      mockRequest.query = { 
        start_date: '2023-01-01', 
        end_date: '2023-01-31' 
      };
      
      const mockBudgets = [];
      const mockFrom = vi.fn().mockReturnThis();
      const mockSelect = vi.fn().mockReturnThis();
      const mockEq = vi.fn().mockReturnThis();
      const mockOrder = vi.fn().mockReturnThis();
      const mockGte = vi.fn().mockReturnThis();
      const mockLte = vi.fn().mockReturnThis();
      const mockRange = vi.fn().mockResolvedValue({
        data: mockBudgets,
        error: null,
        count: 0
      });
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        select: mockSelect,
        eq: mockEq,
        order: mockOrder,
        gte: mockGte,
        lte: mockLte,
        range: mockRange
      } as any);
      
      await getAllBudgets(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockGte).toHaveBeenCalled();
      expect(mockLte).toHaveBeenCalled();
    });
  });
  
  describe('getBudgetById', () => {
    it('should get a budget by ID with expenses', async () => {
      mockRequest.params = { id: '1' };
      
      const mockBudget = { 
        id: '1', 
        name: 'Monthly Groceries',
        amount: 500,
        categories: { name: 'Food' }
      };
      
      const mockExpenses = [
        { id: 'e1', amount: 100, description: 'Grocery store' },
        { id: 'e2', amount: 50, description: 'Farmer market' },
      ];
      
      // Mock the budget query
      vi.spyOn(supabase, 'from').mockImplementation((table: string) => {
        if (table === 'budgets') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockReturnThis(),
            single: vi.fn().mockResolvedValue({
              data: mockBudget,
              error: null
            })
          } as any;
        } else if (table === 'expenses') {
          return {
            select: vi.fn().mockReturnThis(),
            eq: vi.fn().mockResolvedValue({
              data: mockExpenses,
              error: null
            })
          } as any;
        }
        return {} as any;
      });
      
      await getBudgetById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: {
          ...mockBudget,
          expenses: mockExpenses,
          total_spent: 150,
          remaining: 350
        },
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
      
      await getBudgetById(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockNext).toHaveBeenCalled();
      const error = mockNext.mock.calls[0][0];
      expect(error.statusCode).toEqual(404);
    });
  });
  
  describe('createBudget', () => {
    it('should create a budget successfully', async () => {
      const budgetData = { 
        name: 'Entertainment Budget',
        amount: 300,
        start_date: '2023-01-01',
        end_date: '2023-01-31',
        category_id: '123e4567-e89b-12d3-a456-426614174002'
      };
      mockRequest.body = budgetData;
      
      const mockBudget = {
        id: '123',
        ...budgetData,
        user_id: '123e4567-e89b-12d3-a456-426614174001',
        created_at: '2023-01-01T00:00:00Z',
        updated_at: '2023-01-01T00:00:00Z'
      };
      
      vi.spyOn(supabase, 'from').mockReturnValue({
        insert: vi.fn().mockReturnThis(),
        select: vi.fn().mockReturnThis(),
        single: vi.fn().mockResolvedValue({
          data: mockBudget,
          error: null
        })
      } as any);
      
      await createBudget(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(201);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockBudget,
      });
    });
  });
  
  describe('getBudgetSummary', () => {
    it('should get budget summary successfully', async () => {
      mockRequest.query = { 
        start_date: '2023-01-01', 
        end_date: '2023-01-31' 
      };
      
      const mockSummary = [
        { category_name: 'Food', budget_amount: 500, expenses_amount: 350, remaining: 150 },
        { category_name: 'Transport', budget_amount: 200, expenses_amount: 180, remaining: 20 }
      ];
      
      vi.spyOn(supabase, 'rpc').mockResolvedValue({
        data: mockSummary,
        error: null
      } as any);
      
      await getBudgetSummary(
        mockRequest as Request,
        mockResponse as Response,
        mockNext
      );
      
      expect(mockResponse.status).toHaveBeenCalledWith(200);
      expect(mockResponse.json).toHaveBeenCalledWith({
        status: 'success',
        data: mockSummary,
      });
    });
  });
});
