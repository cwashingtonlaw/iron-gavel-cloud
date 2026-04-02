import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './auth/auth.router.js';

export const app = express();

app.use(express.json());
app.use(cookieParser());

app.get('/api/v1/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/v1/auth', authRouter);
