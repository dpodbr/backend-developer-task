import { Router } from 'express';
import { usersController } from 'src/controllers/usersController';

export const usersRoutes: Router = Router();

usersRoutes.get('/', usersController.getHelloWorld);
