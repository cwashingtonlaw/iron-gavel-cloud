import { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { prisma } from '../lib/prisma.js';

export function auditLog(action: string, entityType: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const originalJson = res.json.bind(res);

    res.json = function (body: any) {
      if (res.statusCode >= 200 && res.statusCode < 300 && req.user) {
        const entityId = body?.id ?? req.params?.id ?? req.params?.matterId ?? 'unknown';

        createAuditEntry({
          userId: req.user.userId,
          userName: req.user.role,
          action,
          entityType,
          entityId: String(entityId),
          entityName: body?.name,
          changes: action === 'CREATE' ? req.body : undefined,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        }).catch(() => {});
      }

      return originalJson(body);
    };

    next();
  };
}

async function createAuditEntry(data: {
  userId: string;
  userName: string;
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  changes?: any;
  ipAddress?: string;
  userAgent?: string;
}) {
  const lastLog = await prisma.auditLog.findFirst({
    orderBy: { timestamp: 'desc' },
    select: { hash: true },
  });

  const hashContent = JSON.stringify({
    ...data,
    timestamp: new Date().toISOString(),
    previousHash: lastLog?.hash,
  });
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  await prisma.auditLog.create({
    data: {
      ...data,
      changes: data.changes ?? undefined,
      hash,
      previousHash: lastLog?.hash ?? undefined,
    },
  });
}
