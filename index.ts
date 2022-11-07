import express, { Express } from 'express';
import dotenv from 'dotenv';
import { usersRoutes } from 'src/routes/usersRoutes';

dotenv.config();

const app: Express = express();
const port: string = process.env.PORT ?? '8000';

app.use('/users', usersRoutes);

app.listen(port, () => {
  console.log(`[server]: Server running at http://localhost:${port}`);
});
