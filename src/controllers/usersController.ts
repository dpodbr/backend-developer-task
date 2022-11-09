import { Request, Response } from 'express';
import { User } from 'src/models/entities/user';
import { usersService } from 'src/services/usersService';
import { logger } from 'src/utils/logger';

export class UsersController {
  public async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const users: User[] = await usersService.getUsers();
      res.status(200).send(users);
    } catch (err) {
      logger.error('getUsers failed.', err);
      res.status(500).send((err as Error).message);
    }
  }
}

export const usersController: UsersController = new UsersController();
