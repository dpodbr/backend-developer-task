import { Request, Response } from 'express';
import { usersService } from 'src/services/usersService';

export class UsersController {
  public getHelloWorld(req: Request, res: Response): void {
    res.send(usersService.helloWorld());
  }
}

export const usersController: UsersController = new UsersController();
