import bodyParser from 'body-parser';
import 'dotenv/config';
import express, { Express } from 'express';
import { authHandlerMiddleware } from 'src/middlewares/authHandlerMiddleware';
import { foldersRoutes } from 'src/routes/foldersRoutes';
import { notesRoutes, optionalAuthNotesRoutes } from 'src/routes/notesRoutes';
import { usersRoutes } from 'src/routes/usersRoutes';
import { databaseService } from 'src/services/databaseService';
import { logger } from 'src/utils/logger';

const app: Express = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

databaseService
  .openConnection()
  .then(async () => {
    return await authHandlerMiddleware.loadCredentials();
  })
  .then(() => {
    // Register optional authentication routes.
    app.use('/notes', optionalAuthNotesRoutes);
  })
  .then(() => {
    app.use((req, res, next) => {
      return authHandlerMiddleware.authenticateCredentials(req, res, next);
    });
  })
  .then(() => {
    // Register required authenticaton routes.
    app.use('/users', usersRoutes);
    app.use('/folders', foldersRoutes);
    app.use('/notes', notesRoutes);
    // Unmatched routes.
    app.use((req, res) => {
      res.status(404).send({ message: 'Route not found.' });
    });
  })
  .then(() => {
    // Start server.
    const port: string = process.env.PORT ?? '8000';
    app.listen(port, () => {
      logger.info(`Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    logger.error('Unknown error.', err);
  });
