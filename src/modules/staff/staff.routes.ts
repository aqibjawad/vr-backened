import express, { Request, Response, RequestHandler } from 'express';
import { signupStaff, loginAuth, googleLogin, getUsers, getUserById, deleteUserById, verifyLoginOtp } from './staff.controller';

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  signupStaff: signupStaff as unknown as RequestHandler,
  loginAuth: loginAuth as unknown as RequestHandler,
  googleLogin: googleLogin as unknown as RequestHandler,
  getUsers: getUsers as unknown as RequestHandler,
  getUserById: getUserById as unknown as RequestHandler,
  deleteUserById: deleteUserById as unknown as RequestHandler,
  verifyLoginOtp: verifyLoginOtp as unknown as RequestHandler
};

const router = express.Router();

router.post('/add-staff', handlers.signupStaff);
router.post('/login-staff', handlers.loginAuth);
router.post('/verify-login-otp', handlers.verifyLoginOtp);
router.post('/googleLogin-staff', handlers.googleLogin);
router.get('/get-staff', handlers.getUsers);
router.get('/user/:id', handlers.getUserById);
router.delete('/delete-staff/:id', handlers.deleteUserById);
router.get('/verify-token', (req: Request, res: Response) => { res.json('1'); });

export default router;
 