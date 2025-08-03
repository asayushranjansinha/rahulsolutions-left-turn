import { Router } from 'express';
import { loginOrSignup } from './auth-controllers';

const authRoutes = Router();

// POST /auth/login → Login or signup
authRoutes.post('/', loginOrSignup);

export { authRoutes };
