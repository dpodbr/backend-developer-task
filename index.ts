import 'dotenv/config';
import express, { Express } from 'express';
import { usersRoutes } from 'src/routes/usersRoutes';
import { databaseService } from 'src/services/databaseService';
import { logger } from 'src/utils/logger';
import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';
import { foldersRoutes } from 'src/routes/foldersRoutes';
import bodyParser from 'body-parser';

const app: Express = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

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
    // Register routes and start server.
    const port: string = process.env.PORT ?? '8000';

    app.use('/users', usersRoutes);
    app.use('/folders', foldersRoutes);
    // Handle unmatched routes.
    app.use((req, res) => {
      res.status(404).send({ message: 'Route not found.' });
    });

    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error('Unknown error.', err);
  });
