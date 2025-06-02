import express, { RequestHandler } from 'express';
import { upload } from '../../helpers/upload';
import { createSubCategory, getSubCategoryById, getSubCategories, searchSubCategories, deleteSubCategory } from './subcategory.controller';

const router = express.Router();

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  createSubCategory: createSubCategory as unknown as RequestHandler,
  getSubCategoryById: getSubCategoryById as unknown as RequestHandler,
  getSubCategories: getSubCategories as unknown as RequestHandler,
  searchSubCategories: searchSubCategories as unknown as RequestHandler,
  deleteSubCategory: deleteSubCategory as unknown as RequestHandler
};

router.get('/get-subcategories', handlers.getSubCategories);
router.get('/searchSubCategories', handlers.searchSubCategories);
router.post('/add-subcategory', handlers.createSubCategory);
router.get('/get-subcategories/:id', handlers.getSubCategoryById);
router.delete('/delete/:id', handlers.deleteSubCategory);

export default router;
 