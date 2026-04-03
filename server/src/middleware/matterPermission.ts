import { Request, Response, NextFunction } from 'express';
import { prisma } from '../lib/prisma.js';

export async function checkMatterPermission(req: Request, res: Response, next: NextFunction): Promise<void> {
  const { matterId } = req.params;
  if (!matterId) {
    next();
    return;
  }

  const matter = await prisma.matter.findUnique({
    where: { id: matterId },
    select: { permissions: true, responsibleAttorneyId: true },
  });

  if (!matter) {
    res.status(404).json({ error: 'Matter not found' });
    return;
  }

  const userId = req.user!.userId;
  const role = req.user!.role;

  // Admins can access everything
  if (role === 'Admin') {
    next();
    return;
  }

  switch (matter.permissions) {
    case 'Firm':
      next();
      return;

    case 'Private':
      if (matter.responsibleAttorneyId === userId) {
        next();
        return;
      }
      res.status(403).json({ error: 'Access denied — private matter' });
      return;

    case 'Selective': {
      const access = await prisma.matterAccess.findUnique({
        where: { matterId_userId: { matterId, userId } },
      });
      if (access || matter.responsibleAttorneyId === userId) {
        next();
        return;
      }
      res.status(403).json({ error: 'Access denied — not in allowed list' });
      return;
    }
  }
}
