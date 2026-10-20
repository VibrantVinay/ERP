import { Router } from 'express';
import { authController } from './controller';

const router = Router();

router.post('/login', authController.login.bind(authController));
router.post('/pin-login', authController.pinLogin.bind(authController));
router.get('/me', authController.getMe.bind(authController));
router.post('/logout', authController.logout.bind(authController));
router.post('/switch-branch', authController.switchBranch.bind(authController));
router.get('/demo-personas', authController.getDemoPersonas.bind(authController));
router.post('/clean-users', authController.cleanUsers.bind(authController));

export const authRouter = router;
