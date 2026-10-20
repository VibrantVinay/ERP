import { Router } from 'express';
import { authController } from './controller';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.get('/me', authController.getMe.bind(authController));

export const authRouter = router;

