import { Router } from 'express';
import { notesController } from 'src/controllers/notesController';
import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';

export const optionalAuthNotesRoutes: Router = Router();
export const notesRoutes: Router = Router();

optionalAuthNotesRoutes.get('/', (req, res, next) => { return authHandlerMiddleware.authenticateCredentials(req, res, next, true); }, notesController.getNotes);
optionalAuthNotesRoutes.get('/:id', (req, res, next) => { return authHandlerMiddleware.authenticateCredentials(req, res, next, true); }, notesController.getNote);

notesRoutes.post('/', notesController.createNote);
notesRoutes.put('/:id', notesController.updateNote);
notesRoutes.delete('/:id', notesController.deleteNote);
