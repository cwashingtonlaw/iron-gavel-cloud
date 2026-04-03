import { Router } from 'express';
import { mattersRouter } from './matters.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
