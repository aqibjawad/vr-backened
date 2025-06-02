import express, { RequestHandler } from 'express';
import { addRecord, approveReview, deleteRecord, getAll, getApproved, getCount, getReviewsByBusinessId } from './review.controller';
import { validateKeyInputs } from '../../middlewares/validate';

const router = express.Router();

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  addRecord: addRecord as unknown as RequestHandler,
  approveReview: approveReview as unknown as RequestHandler,
  deleteRecord: deleteRecord as unknown as RequestHandler,
  getAll: getAll as unknown as RequestHandler,
  getApproved: getApproved as unknown as RequestHandler,
  getCount: getCount as unknown as RequestHandler,
  getReviewsByBusinessId: getReviewsByBusinessId as unknown as RequestHandler
};

// Cast middleware to RequestHandler
const validateInputs = (key: 'body' | 'query' | 'params', inputArr: string[]) => validateKeyInputs({ key, inputArr }) as unknown as RequestHandler;

router.post('/addRecord', handlers.addRecord);
router.post('/approveReview', validateInputs('body', ['id']), handlers.approveReview);

router.delete('/deleteRecord', handlers.deleteRecord);

router.get('/getRecords', handlers.getApproved);

router.get('/getAllReviews', handlers.getAll);

router.get('/getCount', handlers.getCount);

router.get('/getRecord/:_id', handlers.getReviewsByBusinessId);

export default router;
