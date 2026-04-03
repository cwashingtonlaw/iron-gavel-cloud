import { Router } from 'express';
import { mattersRouter } from './matters.router.js';
import { contactsRouter } from './contacts.router.js';
import { tasksRouter } from './tasks.router.js';
import { eventsRouter } from './events.router.js';
import { communicationsRouter } from './communications.router.js';
import { timeEntriesRouter } from './timeEntries.router.js';
import { expensesRouter } from './expenses.router.js';
import { invoicesRouter } from './invoices.router.js';
import { transactionsRouter, trustRouter } from './transactions.router.js';

export const apiRouter = Router();

apiRouter.use('/matters', mattersRouter);
apiRouter.use('/contacts', contactsRouter);
apiRouter.use('/tasks', tasksRouter);
apiRouter.use('/events', eventsRouter);
apiRouter.use('/communications', communicationsRouter);
apiRouter.use('/time-entries', timeEntriesRouter);
apiRouter.use('/expenses', expensesRouter);
apiRouter.use('/invoices', invoicesRouter);
apiRouter.use('/transactions', transactionsRouter);
apiRouter.use('/trust', trustRouter);
