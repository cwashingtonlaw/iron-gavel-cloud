import { Router } from 'express';
import { mattersRouter } from './matters.router.js';
import { contactsRouter } from './contacts.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
apiRouter.use('/contacts', contactsRouter);
