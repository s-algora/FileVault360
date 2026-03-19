import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

import authRouter from './routes/auth.routes';
import filesRouter from './routes/files.routes';
import sharedFilesRouter from './routes/shared-files.routes';
import { errorHandler } from './middleware/error.middleware';

const app = express();

app.use(helmet());
app.use(cors({
  origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));

const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan('dev'));

app.use('/auth', authRouter);
app.use('/files', filesRouter);
app.use('/shared-files', sharedFilesRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'FileVault360 API', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

export default app;
