import { Router } from 'express';
import { foldersController } from 'src/controllers/foldersController';

export const foldersRoutes: Router = Router();

foldersRoutes.get('/', foldersController.getFolders);
foldersRoutes.get('/:id', foldersController.getFolder);
foldersRoutes.post('/', foldersController.createFolder);
foldersRoutes.put('/:id', foldersController.updateFolder);
foldersRoutes.delete('/:id', foldersController.deleteFolder);
