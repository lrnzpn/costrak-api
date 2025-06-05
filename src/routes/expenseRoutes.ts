import { Router } from 'express';
import {
  getAllExpenses,
  getExpenseById,
  createExpense,
  updateExpense,
  deleteExpense,
  getExpenseSummary,
} from '../controllers/expenseController';
import { validate } from '../middlewares/validationMiddleware';
import {
  createExpenseSchema,
  updateExpenseSchema,
  paginationSchema,
  dateRangeSchema,
} from '../models/schemas';

const router = Router();

router
  .route('/')
  .get(validate({ ...paginationSchema, ...dateRangeSchema }, 'query'), getAllExpenses)
  .post(validate(createExpenseSchema), createExpense);

router.route('/summary').get(validate(dateRangeSchema, 'query'), getExpenseSummary);

router
  .route('/:id')
  .get(getExpenseById)
  .patch(validate(updateExpenseSchema), updateExpense)
  .delete(deleteExpense);

export default router;
