import express, { RequestHandler } from 'express';
import { businessStats, categoryStats, subCategoryStats } from './controllers';
import { validateKeyInputs } from '../../middlewares/validate';

const router = express.Router();

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  businessStats: businessStats as unknown as RequestHandler,
  categoryStats: categoryStats as unknown as RequestHandler,
  subCategoryStats: subCategoryStats as unknown as RequestHandler
};

// Cast middleware to RequestHandler
const validateQueryInputs = (inputArr: string[] = []) => validateKeyInputs({ key: "query", inputArr }) as unknown as RequestHandler;

router.get('/businessStats', validateQueryInputs(), handlers.businessStats);
router.get('/categoryStats', validateQueryInputs(), handlers.categoryStats);
router.get('/subCategoryStats', validateQueryInputs(), handlers.subCategoryStats);

export default router;
