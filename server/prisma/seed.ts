import { PrismaClient, UserRole, MatterStatus, BillingType, MatterPermission, ContactType, ExpenseType, InvoiceStatus, TransactionType, LedgerType } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

async function main() {
  console.log('Seeding database...');

  // Users
  const admin = await prisma.user.create({
    data: {
      id: 'USER_1',
      email: 'christopher.washington@greatelephantlaw.com',
      passwordHash: await hashPassword('admin123'),
      name: 'Christopher Washington',
      role: UserRole.Admin,
      defaultRate: 350,
      avatarUrl: '/christopher-washington.jpg',
    },
  });

  const attorney = await prisma.user.create({
    data: {
      id: 'USER_2',
      email: 'rozshelle@greatelephantlaw.com',
      passwordHash: await hashPassword('attorney123'),
      name: 'Rozshelle Laher',
      role: UserRole.Attorney,
      defaultRate: 300,
    },
  });

  const paralegal = await prisma.user.create({
    data: {
      id: 'USER_3',
      email: 'riza@greatelephantlaw.com',
      passwordHash: await hashPassword('paralegal123'),
      name: 'Riza Fortes',
      role: UserRole.Paralegal,
      defaultRate: 150,
    },
  });

  // Contacts
  const contact1 = await prisma.contact.create({
    data: {
      id: 'CON_1',
      name: 'Arthur Dent',
      email: 'arthur@dent.com',
      phone: '555-4242',
      type: ContactType.Client,
      hasPortalAccess: true,
      isCompany: false,
    },
  });

  const contact2 = await prisma.contact.create({
    data: {
      id: 'CON_2',
      name: 'Trillian Astra',
      email: 'trillian@heartofgold.com',
      phone: '555-1234',
      type: ContactType.Client,
      hasPortalAccess: false,
      isCompany: false,
    },
  });

  // Matters
  const matter1 = await prisma.matter.create({
    data: {
      id: 'MAT-001',
      name: 'Dent v. Vogon Construction Co.',
      client: 'Arthur Dent',
      status: MatterStatus.Open,
      openDate: new Date('2025-06-15'),
      notes: 'Property dispute — Vogon bypass demolition of client home.',
      billingType: BillingType.Hourly,
      billingRate: 350,
      permissions: MatterPermission.Firm,
      responsibleAttorneyId: admin.id,
      practiceArea: 'Litigation',
      estimatedValue: 150000,
    },
  });

  const matter2 = await prisma.matter.create({
    data: {
      id: 'MAT-002',
      name: 'Astra Employment Dispute',
      client: 'Trillian Astra',
      status: MatterStatus.Open,
      openDate: new Date('2025-09-01'),
      notes: 'Wrongful termination from Magrathea Corp.',
      billingType: BillingType.Contingency,
      billingFee: 33.33,
      permissions: MatterPermission.Firm,
      responsibleAttorneyId: attorney.id,
      practiceArea: 'Personal Injury',
      estimatedValue: 250000,
    },
  });

  // Link contacts to matters
  await prisma.matterContact.createMany({
    data: [
      { matterId: matter1.id, contactId: contact1.id, role: 'Client' },
      { matterId: matter2.id, contactId: contact2.id, role: 'Client' },
    ],
  });

  // Related parties
  await prisma.relatedParty.create({
    data: {
      matterId: matter1.id,
      name: 'Prostetnic Vogon Jeltz',
      role: 'Opposing Party',
      notes: 'Vogon Construction Company representative',
    },
  });

  // Tasks
  await prisma.task.createMany({
    data: [
      {
        matterId: matter1.id,
        description: 'File initial complaint',
        dueDate: new Date('2026-04-10'),
        priority: 'High',
        assignedUserId: admin.id,
      },
      {
        matterId: matter1.id,
        description: 'Request production of documents',
        dueDate: new Date('2026-04-20'),
        priority: 'Medium',
        assignedUserId: paralegal.id,
      },
      {
        matterId: matter2.id,
        description: 'Draft demand letter',
        dueDate: new Date('2026-04-15'),
        priority: 'High',
        assignedUserId: attorney.id,
      },
    ],
  });

  // Time entries
  await prisma.timeEntry.createMany({
    data: [
      {
        matterId: matter1.id,
        userId: admin.id,
        date: new Date('2026-03-28'),
        description: 'Initial client consultation and case review',
        duration: 1.5,
        rate: 350,
      },
      {
        matterId: matter1.id,
        userId: paralegal.id,
        date: new Date('2026-03-29'),
        description: 'Research local property law precedents',
        duration: 3.0,
        rate: 150,
      },
      {
        matterId: matter2.id,
        userId: attorney.id,
        date: new Date('2026-03-30'),
        description: 'Review employment contract and termination docs',
        duration: 2.0,
        rate: 300,
      },
    ],
  });

  // Expenses
  await prisma.expense.createMany({
    data: [
      {
        matterId: matter1.id,
        date: new Date('2026-03-28'),
        description: 'Court filing fee',
        amount: 435,
        type: ExpenseType.HardCost,
      },
      {
        matterId: matter2.id,
        date: new Date('2026-03-30'),
        description: 'Process server fee',
        amount: 85,
        type: ExpenseType.HardCost,
      },
    ],
  });

  // Invoices
  await prisma.invoice.createMany({
    data: [
      {
        matterId: matter1.id,
        issueDate: new Date('2026-03-31'),
        dueDate: new Date('2026-04-30'),
        amount: 1410,
        status: InvoiceStatus.Unpaid,
        balance: 1410,
        clientName: 'Arthur Dent',
      },
    ],
  });

  // Transactions (trust deposit)
  await prisma.transaction.createMany({
    data: [
      {
        matterId: matter1.id,
        date: new Date('2026-03-25'),
        type: TransactionType.Deposit,
        ledger: LedgerType.Trust,
        description: 'Initial retainer deposit',
        amount: 5000,
      },
      {
        matterId: matter1.id,
        date: new Date('2026-03-28'),
        type: TransactionType.Payment,
        ledger: LedgerType.Trust,
        description: 'Court filing fee from trust',
        amount: 435,
      },
    ],
  });

  // Events
  await prisma.event.createMany({
    data: [
      {
        matterId: matter1.id,
        title: 'Initial Case Strategy Meeting',
        date: new Date('2026-04-05'),
        startTime: '10:00 AM',
        endTime: '11:00 AM',
        type: 'Meeting',
        location: 'Conference Room A',
      },
      {
        matterId: matter2.id,
        title: 'Deposition of HR Director',
        date: new Date('2026-04-18'),
        startTime: '2:00 PM',
        endTime: '4:00 PM',
        type: 'Deposition',
        location: 'Opposing counsel office',
      },
    ],
  });

  // Communications
  await prisma.communication.createMany({
    data: [
      {
        matterId: matter1.id,
        type: 'Email',
        subject: 'Case update — Dent v. Vogon',
        date: new Date('2026-03-28'),
        participants: JSON.parse('["Arthur Dent", "Christopher Washington"]'),
        summary: 'Discussed initial strategy and timeline for filing.',
      },
    ],
  });

  // Documents (metadata only — no files yet)
  await prisma.document.create({
    data: {
      matterId: matter1.id,
      name: 'Initial Complaint Draft.pdf',
      category: 'Pleadings',
      size: '245 KB',
      versions: {
        create: {
          version: 1,
          filePath: '/data/iron-gavel/files/matters/MAT-001/complaint-v1.pdf',
          uploadedById: admin.id,
        },
      },
    },
  });

  // Audit log (first entry)
  const hashContent = JSON.stringify({ action: 'SEED', timestamp: new Date().toISOString() });
  const hash = crypto.createHash('sha256').update(hashContent).digest('hex');

  await prisma.auditLog.create({
    data: {
      userId: admin.id,
      userName: admin.name,
      action: 'CREATE',
      entityType: 'System',
      entityId: 'SEED',
      entityName: 'Database Seed',
      hash: hash,
    },
  });

  console.log('Seed complete.');
  console.log(`  Users: 3`);
  console.log(`  Contacts: 2`);
  console.log(`  Matters: 2`);
  console.log(`  Tasks: 3`);
  console.log(`  Time Entries: 3`);
  console.log(`  Expenses: 2`);
  console.log(`  Invoices: 1`);
  console.log(`  Transactions: 2`);
  console.log(`  Events: 2`);
  console.log(`  Communications: 1`);
  console.log(`  Documents: 1`);
  console.log(`  Audit Logs: 1`);
}

main()
  .catch((e) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
