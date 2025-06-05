import { Router } from 'express';
import { 
  getAllBudgets,
  getBudgetById,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
} from '../controllers/budgetController';
import { validate } from '../middlewares/validationMiddleware';
import { 
  createBudgetSchema, 
  updateBudgetSchema, 
  paginationSchema,
  dateRangeSchema
} from '../models/schemas';

const router = Router();

router.route('/')
  .get(validate({ ...paginationSchema, ...dateRangeSchema }, 'query'), getAllBudgets)
  .post(validate(createBudgetSchema), createBudget);

router.route('/summary')
  .get(validate(dateRangeSchema, 'query'), getBudgetSummary);

router.route('/:id')
  .get(getBudgetById)
  .patch(validate(updateBudgetSchema), updateBudget)
  .delete(deleteBudget);

export default router;
