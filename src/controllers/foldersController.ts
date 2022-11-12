import { Request, Response } from 'express';
import { Folder } from 'src/models/folder';
import { foldersService } from 'src/services/foldersService';
import { logger } from 'src/utils/logger';

export class FoldersController {
  public async getFolders(req: Request, res: Response): Promise<void> {
    try {
      const result: Folder[] | null = await foldersService.getFolders(req.userId);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(500).send({ message: 'Folders retrieval failed.' });
        logger.warning('getFolders failed.', req);
      }
    } catch (err) {
      logger.error('getFolders failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public async getFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      const result: Folder | null = await foldersService.getFolder(req.userId, folderId);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(500).send({ message: 'Folder retrieval failed.' });
        logger.warning('getFolder failed.', req);
      }
    } catch (err) {
      logger.error('getFolder failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public async createFolder(req: Request, res: Response): Promise<void> {
    try {
      const folder: Folder = req.body as Folder;
      const result: Folder | null = await foldersService.createFolder(req.userId, folder);
      if (result !== null) {
        res.status(201).send(result);
      } else {
        res.status(500).send({ message: 'Folder creation failed.' });
        logger.warning('createFolder failed.', req);
      }
    } catch (err) {
      logger.error('createFolder failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public async updateFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      const folder: Folder = req.body as Folder;
      const result: Folder | null = await foldersService.updateFolder(req.userId, folderId, folder);
      if (result !== null) {
        res.status(200).send(result);
      } else {
        res.status(500).send({ message: 'Folder update failed.' });
        logger.warning('updateFolder failed.', req);
      }
    } catch (err) {
      logger.error('updateFolder failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }

  public async deleteFolder(req: Request, res: Response): Promise<void> {
    try {
      const folderId: string = req.params.id;
      const result: boolean = await foldersService.deleteFolder(req.userId, folderId);
      if (result) {
        res.status(200).send();
      } else {
        res.status(500).send({ message: 'Folder deletion failed.' });
        logger.warning('deleteFolder failed.', req);
      }
    } catch (err) {
      logger.error('deleteFolder failed.', err);
      res.status(500).json({ message: (err as Error).message });
    }
  }
}

export const foldersController: FoldersController = new FoldersController();
