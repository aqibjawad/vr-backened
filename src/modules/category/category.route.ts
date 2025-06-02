import express, { RequestHandler } from 'express';
import { createCategory, getCategories, deleteCategory, updateCategory, searchCategories } from './category.controller';

const router = express.Router();

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  createCategory: createCategory as unknown as RequestHandler,
  getCategories: getCategories as unknown as RequestHandler,
  deleteCategory: deleteCategory as unknown as RequestHandler,
  updateCategory: updateCategory as unknown as RequestHandler,
  searchCategories: searchCategories as unknown as RequestHandler
};


router.get('/get-categories', handlers.getCategories);
router.get('/searchCategories', handlers.searchCategories);
router.post('/add-category', handlers.createCategory);
router.put('/update-category/:id', handlers.updateCategory);
router.delete('/delete-category/:id', handlers.deleteCategory);

export default router;
