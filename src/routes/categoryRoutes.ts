import { Router } from 'express';
import { 
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory
} from '../controllers/categoryController';
import { validate } from '../middlewares/validationMiddleware';
import { 
  createCategorySchema, 
  updateCategorySchema, 
  paginationSchema 
} from '../models/schemas';

const router = Router();

router.route('/')
  .get(validate(paginationSchema, 'query'), getAllCategories)
  .post(validate(createCategorySchema), createCategory);

router.route('/:id')
  .get(getCategoryById)
  .patch(validate(updateCategorySchema), updateCategory)
  .delete(deleteCategory);

export default router;
