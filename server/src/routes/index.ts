import { Router } from 'express';
import { mattersRouter } from './matters.router.js';
import { contactsRouter } from './contacts.router.js';
import { tasksRouter } from './tasks.router.js';
import { eventsRouter } from './events.router.js';
import { communicationsRouter } from './communications.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/communications', communicationsRouter);
