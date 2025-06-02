import express, { Request, Response, NextFunction, RequestHandler } from 'express';
import { signupUser, loginAuth, googleLogin, getUsers, getUserById, deleteUserById, verifyLoginOtp, updatePassword } from './user.controller';

// Cast handlers to RequestHandler type using unknown as intermediate
const handlers = {
  signupUser: signupUser as unknown as RequestHandler,
  loginAuth: loginAuth as unknown as RequestHandler,
  googleLogin: googleLogin as unknown as RequestHandler,
  getUsers: getUsers as unknown as RequestHandler,
  getUserById: getUserById as unknown as RequestHandler,
  deleteUserById: deleteUserById as unknown as RequestHandler,
  verifyLoginOtp: verifyLoginOtp as unknown as RequestHandler,
  updatePassword: updatePassword as unknown as RequestHandler
};

const router = express.Router();

router.post('/add-user', handlers.signupUser);
router.post('/login-user', handlers.loginAuth);
router.post('/update-password', handlers.updatePassword);
router.post('/login-admin', handlers.loginAuth);
router.post('/verify-login-otp', handlers.verifyLoginOtp);
router.post('/googleLogin-user', handlers.googleLogin);
router.get('/get-users', handlers.getUsers);
router.get('/user/:id', handlers.getUserById);
router.delete('/delete-user/:id', handlers.deleteUserById);
router.get('/verify-token', (req: Request, res: Response) => { res.json('1'); });

export default router;
