import express, { Request, Response, RequestHandler } from 'express';
import { signupBusiness, signupBusinessAdmin, loginAuth, addPassword, googleLogin, verifyOtp, getUsers, searchBusiness, searchAll, getUserById, deleteUserById } from './business.controller';

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  signupBusiness: signupBusiness as unknown as RequestHandler,
  signupBusinessAdmin: signupBusinessAdmin as unknown as RequestHandler,
  loginAuth: loginAuth as unknown as RequestHandler,
  addPassword: addPassword as unknown as RequestHandler,
  googleLogin: googleLogin as unknown as RequestHandler,
  verifyOtp: verifyOtp as unknown as RequestHandler,
  getUsers: getUsers as unknown as RequestHandler,
  searchBusiness: searchBusiness as unknown as RequestHandler,
  searchAll: searchAll as unknown as RequestHandler,
  getUserById: getUserById as unknown as RequestHandler,
  deleteUserById: deleteUserById as unknown as RequestHandler
};

const router = express.Router();

router.post('/add-business', handlers.signupBusiness);
router.post('/add-businessAdmin', handlers.signupBusinessAdmin);
router.post('/login-business', handlers.loginAuth);
router.post('/addPassword-business', handlers.addPassword);
router.post('/googleLogin-business', handlers.googleLogin);
router.get('/verify-business', handlers.verifyOtp);
router.get('/get-business', handlers.getUsers);
router.get('/searchBusiness', handlers.searchBusiness);
router.get('/searchAll', handlers.searchAll); 
router.get('/user/:id', handlers.getUserById);
router.delete('/delete-business/:id', handlers.deleteUserById);
router.get('/verify-token', (req: Request, res: Response) => { res.json('1'); });

export default router;
