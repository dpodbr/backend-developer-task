import 'dotenv/config';
import express, { Express } from 'express';
import { usersRoutes } from 'src/routes/usersRoutes';
import { databaseService } from 'src/services/databaseService';
import { logger } from 'src/utils/logger';

const app: Express = express();

app.use('/users', usersRoutes);

databaseService
  .openConnection()
  .then(() => {
    const port: string = process.env.PORT ?? '8000';

    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error('Unknown error.', err);
  });
