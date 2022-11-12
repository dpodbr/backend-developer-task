import { Request, Response, NextFunction } from 'express';
import { User } from 'src/models/user';
import { usersService } from 'src/services/usersService';
import bcrypt from 'bcryptjs';
import { logger } from 'src/utils/logger';

export class AuthHandlerMiddleware {
  private readonly saltRounds: number = 10;
  private readonly credentials: any;

  constructor() {
    this.credentials = {};
  }

  public async loadCredentials(): Promise<void> {
    const users: User[] = await usersService.getUsers();

    for (const user of users) {
      this.credentials[user.username] = {
        id: user._id,
        password: user.password
      };
    }
  }

  public hashPassword(password: string): string {
    return bcrypt.hashSync(password, this.saltRounds);
  }

  public authenticateCredentials(req: Request, res: Response, next: NextFunction): void {
    let username: string = '';
    let password: string = '';

    if (req.headers?.authorization === undefined || !req.headers.authorization.includes('Basic ')) {
      logger.info('Missing auth header.', req.headers);
      res.status(401).json({ message: 'Missing auth header.' });
      return;
    } else {
      const base64Credentials = req.headers.authorization.split(' ')[1];
      const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii');
      const split = credentials.split(':');
      username = split[0];
      password = split[1];
    }

    if (this.credentials[username] !== undefined && bcrypt.compareSync(password, this.credentials[username].password)) {
      req.userId = this.credentials[username].id;
      next();
    } else {
      logger.info('Wrong username / password.', req.headers);
      res.status(401).json({ message: 'Wrong username / password.' });
    }
  }
}

export const authHandlerMiddleware: AuthHandlerMiddleware = new AuthHandlerMiddleware();
