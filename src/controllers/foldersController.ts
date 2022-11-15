import { Request, Response } from 'express';
import { Folder } from 'src/models/folder';
import { foldersService } from 'src/services/foldersService';
import { handleError } from 'src/utils/errorHandler';

export class FoldersController {
  public async getFolders(req: Request, res: Response): Promise<void> {
    try {
      const folders: Folder[] = await foldersService.getFolders(req.userId);
      res.status(200).send(folders);
    } catch (err) {
      handleError('getFolders', err, res);
    }
  }

  public async getFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      const folder: Folder = await foldersService.getFolder(req.userId, folderId);
      res.status(200).send(folder);
    } catch (err) {
      handleError('getFolder', err, res);
    }
  }

  public async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const folder: Folder = req.body as Folder;
      const createdFolder: Folder = await foldersService.createFolder(req.userId, folder);
      res.status(201).send(createdFolder);
    } catch (err) {
      handleError('createFolder', err, res);
    }
  }

  public async updateFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      const folder: Folder = req.body as Folder;
      const updatedFolder: Folder = await foldersService.updateFolder(req.userId, folderId, folder);
      res.status(200).send(updatedFolder);
    } catch (err) {
      handleError('updateFolder', err, res);
    }
  }

  public async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      await foldersService.deleteFolder(req.userId, folderId);
      res.status(204).send();
    } catch (err) {
      handleError('deleteFolder', err, res);
    }
  }
}

export const foldersController: FoldersController = new FoldersController();
