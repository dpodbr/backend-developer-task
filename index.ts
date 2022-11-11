import 'dotenv/config';
import express, { Express } from 'express';
import { usersRoutes } from 'src/routes/usersRoutes';
import { databaseService } from 'src/services/databaseService';
import { logger } from 'src/utils/logger';
import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';

const app: Express = express();

databaseService
  .openConnection()
  .then(async () => {
    // Setup auth middleware.
    await authHandlerMiddleware.loadCredentials();
    app.use((req, res, next) => {
      return authHandlerMiddleware.authenticateCredentials(req, res, next);
    });
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
