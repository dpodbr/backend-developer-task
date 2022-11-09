import 'dotenv/config';
import express, { Express } from 'express';
import { User } from 'src/models/entities/user';
import { usersRoutes } from 'src/routes/usersRoutes';
import { databaseService } from 'src/services/databaseService';
import { usersService } from 'src/services/usersService';
import { logger } from 'src/utils/logger';
import basicAuth from 'express-basic-auth';

const app: Express = express();

databaseService
  .openConnection()
  .then(async () => {
    // Load users / passwords for basic auth.
    const users: User[] = await usersService.getUsers();
    const authData: any = {};

    for (const user of users) {
      authData[user.username] = user.password;
    }

    app.use(basicAuth({
      users: authData
    }));
  })
  .then(() => {
    // Setup router and start server.
    const port: string = process.env.PORT ?? '8000';

    app.use('/users', usersRoutes);

    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error('Unknown error.', err);
  });
