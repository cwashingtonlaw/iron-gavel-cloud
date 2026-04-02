import React, { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import {
  PlusIcon, CheckCircleIcon, BriefcaseIcon, CurrencyDollarIcon,
  ExclamationTriangleIcon, CalendarDaysIcon, UserIcon, BuildingOfficeIcon,
  ClockIcon, BanknotesIcon, CreditCardIcon, ChartBarIcon, UsersIcon, DocumentTextIcon,
  UserPlusIcon, ArrowTrendingUpIcon
} from './icons';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, Legend, LineChart, Line, AreaChart, Area } from 'recharts';

const COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#ef4444', '#06b6d4'];

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { matters, tasks, currentUser, invoices, expenses, timeEntries, activities, events, contacts, potentialClients, getTotalTrustBalance, transactions } = useStore();
  const [activeTab, setActiveTab] = React.useState<'personal' | 'firm'>('personal');

  const today = useMemo(() => { const d = new Date(); d.setHours(0, 0, 0, 0); return d; }, []);

  // Personal calculations
  const myMatters = useMemo(() => matters.filter(m => m.responsibleAttorneyId === currentUser.id), [matters, currentUser.id]);
  const myPendingTasks = useMemo(() => tasks.filter(t => t.assignedUserId === currentUser.id && !t.completed), [tasks, currentUser.id]);
  const myOverdueTasks = useMemo(() => tasks.filter(t => t.assignedUserId === currentUser.id && !t.completed && new Date(t.dueDate) < today), [tasks, currentUser.id, today]);
  const myBillableHoursMTD = useMemo(() =>
    timeEntries.filter(te => te.userId === currentUser.id && new Date(te.date).getMonth() === today.getMonth() && new Date(te.date).getFullYear() === today.getFullYear())
      .reduce((acc, te) => acc + te.duration, 0), [timeEntries, currentUser.id, today]);
  const myCollectionsMTD = useMemo(() =>
    invoices.filter(i => i.status === 'Paid' && new Date(i.issueDate).getMonth() === today.getMonth())
      .reduce((acc, i) => acc + i.amount, 0), [invoices, today]);

  // Firm calculations
  const totalRevenue = useMemo(() => invoices.filter(i => i.status === 'Paid').reduce((a, i) => a + i.amount, 0), [invoices]);
  const totalOutstanding = useMemo(() => invoices.filter(i => i.status !== 'Paid').reduce((a, i) => a + (i.balance || i.amount), 0), [invoices]);
  const trustBalance = getTotalTrustBalance ? getTotalTrustBalance() : 0;
  const wip = useMemo(() => {
    const unbilledTime = timeEntries.filter(t => !t.isBilled).reduce((a, t) => a + t.duration * t.rate, 0);
    const unbilledExpenses = expenses.filter(e => !e.isBilled).reduce((a, e) => a + e.amount, 0);
    return unbilledTime + unbilledExpenses;
  }, [timeEntries, expenses]);
  const totalBilled = useMemo(() => invoices.reduce((a, i) => a + i.amount, 0), [invoices]);
  const realizationRate = totalBilled > 0 ? Math.round((totalRevenue / totalBilled) * 100) : 0;
  const collectionRate = totalBilled > 0 ? Math.round((totalRevenue / (totalRevenue + totalOutstanding)) * 100) : 0;

  // Practice area data
  const practiceAreaData = useMemo(() => matters.reduce((acc: { name: string; value: number }[], m) => {
    const area = m.practiceArea || 'Other';
    const existing = acc.find(i => i.name === area);
    if (existing) existing.value += 1; else acc.push({ name: area, value: 1 });
    return acc;
  }, []), [matters]);

  // Monthly revenue
  const monthlyData = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const data = months.map(m => ({ month: m, revenue: 0, expenses: 0 }));
    invoices.forEach(inv => { const d = new Date(inv.issueDate); if (d.getFullYear() === year && inv.status === 'Paid') data[d.getMonth()].revenue += inv.amount; });
    expenses.forEach(exp => { const d = new Date(exp.date); if (d.getFullYear() === year) data[d.getMonth()].expenses += exp.amount; });
    return data.slice(0, today.getMonth() + 1);
  }, [invoices, expenses, today]);

  // AR Aging
  const arAging = useMemo(() => {
    const aging = { current: 0, days30: 0, days60: 0, days90: 0 };
    invoices.filter(i => i.status !== 'Paid').forEach(inv => {
      const daysPast = Math.floor((today.getTime() - new Date(inv.dueDate).getTime()) / (1000 * 60 * 60 * 24));
      const amt = inv.balance || inv.amount;
      if (daysPast <= 0) aging.current += amt;
      else if (daysPast <= 30) aging.days30 += amt;
      else if (daysPast <= 60) aging.days60 += amt;
      else aging.days90 += amt;
    });
    return aging;
  }, [invoices, today]);

  // Top clients
  const topClients = useMemo(() => {
    const clientMap = new Map<string, number>();
    invoices.filter(i => i.status === 'Paid').forEach(inv => {
      const matter = matters.find(m => m.id === inv.matterId);
      if (matter) clientMap.set(matter.client, (clientMap.get(matter.client) || 0) + inv.amount);
    });
    return Array.from(clientMap.entries()).map(([name, revenue]) => ({ name, revenue })).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
  }, [invoices, matters]);

  // New matters trend
  const newMattersTrend = useMemo(() => {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const year = new Date().getFullYear();
    const data = months.map(m => ({ month: m, count: 0 }));
    matters.forEach(m => { const d = new Date(m.openDate); if (d.getFullYear() === year) data[d.getMonth()].count += 1; });
    return data.slice(0, today.getMonth() + 1);
  }, [matters, today]);

  // Task stats
  const pendingTasks = tasks.filter(t => !t.completed).length;
  const overdueTasks = tasks.filter(t => !t.completed && new Date(t.dueDate) < today).length;
  const completedTasks = tasks.filter(t => t.completed).length;

  const StatCard = ({ title, value, subtitle, icon, colorClass, onClick }: { title: string; value: string; subtitle: string; icon: React.ReactNode; colorClass?: string; onClick?: () => void }) => (
    <div className={`bg-white dark:bg-slate-800 p-5 rounded-xl border border-slate-200 dark:border-slate-700 ${onClick ? 'cursor-pointer hover:shadow-lg transition-all hover:-translate-y-0.5' : ''}`} onClick={onClick}>
      <div className="flex items-center justify-between">
        <h3 className="font-medium text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">{title}</h3>
        <div className="text-slate-400 dark:text-slate-500 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg">{icon}</div>
      </div>
      <p className="text-2xl sm:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">{value}</p>
      <p className={`text-xs mt-1.5 font-medium ${colorClass || 'text-slate-500'}`}>{subtitle}</p>
    </div>
  );

  const quickActions = [
    { label: 'New Matter', icon: <BriefcaseIcon className="w-4 h-4" />, path: '/matters', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 hover:bg-blue-100' },
    { label: 'Log Time', icon: <ClockIcon className="w-4 h-4" />, path: '/billing', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100' },
    { label: 'New Task', icon: <CheckCircleIcon className="w-4 h-4" />, path: '/tasks', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 hover:bg-purple-100' },
    { label: 'New Contact', icon: <UsersIcon className="w-4 h-4" />, path: '/contacts', color: 'bg-amber-50 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 hover:bg-amber-100' },
    { label: 'Upload Doc', icon: <DocumentTextIcon className="w-4 h-4" />, path: '/documents', color: 'bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 hover:bg-rose-100' },
    { label: 'New Lead', icon: <UserPlusIcon className="w-4 h-4" />, path: '/intake', color: 'bg-cyan-50 dark:bg-cyan-900/30 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100' },
  ];

  return (
    <div className="space-y-6">
      {/* Header & Toggle */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-800 dark:text-slate-100">
            {activeTab === 'personal' ? `Welcome back, ${currentUser.name.split(' ')[0]}` : 'Firm Intelligence'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 mt-1 text-sm">
            {activeTab === 'personal' ? `You have ${myPendingTasks.length} pending tasks and ${myMatters.length} active matters.` : 'Firm-wide performance and financial overview.'}
          </p>
        </div>
        <div className="flex bg-slate-100 dark:bg-slate-900/50 p-1 rounded-xl border border-slate-200 dark:border-slate-800">
          <button onClick={() => setActiveTab('personal')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'personal' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <UserIcon className="w-4 h-4" /> Personal
          </button>
          <button onClick={() => setActiveTab('firm')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'firm' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
            <BuildingOfficeIcon className="w-4 h-4" /> Firm Wide
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex gap-2 flex-wrap">
        {quickActions.map(a => (
          <button key={a.label} onClick={() => navigate(a.path)} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold transition-colors ${a.color}`}>
            {a.icon} {a.label}
          </button>
        ))}
      </div>

      {activeTab === 'personal' ? (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            <StatCard title="My Active Matters" value={myMatters.length.toString()} subtitle={`${matters.filter(m => m.status === 'Open').length} total open`} icon={<BriefcaseIcon className="w-5 h-5" />} onClick={() => navigate('/matters')} />
            <StatCard title="Pending Tasks" value={myPendingTasks.length.toString()} subtitle={`${myOverdueTasks.length} overdue`} icon={<CheckCircleIcon className="w-5 h-5" />} colorClass={myOverdueTasks.length > 0 ? 'text-red-500' : 'text-green-500'} onClick={() => navigate('/tasks')} />
            <StatCard title="Overdue Items" value={myOverdueTasks.length.toString()} subtitle="Needs attention" icon={<ExclamationTriangleIcon className="w-5 h-5" />} colorClass="text-red-500" onClick={() => navigate('/tasks')} />
            <StatCard title="Billable Hours (MTD)" value={`${myBillableHoursMTD.toFixed(1)}h`} subtitle="This month" icon={<ClockIcon className="w-5 h-5" />} onClick={() => navigate('/activities')} />
            <StatCard title="Collections (MTD)" value={`$${myCollectionsMTD.toLocaleString()}`} subtitle="Paid invoices" icon={<CurrencyDollarIcon className="w-5 h-5" />} colorClass="text-green-500" onClick={() => navigate('/billing')} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* My Schedule */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700 lg:col-span-2">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <CalendarDaysIcon className="w-5 h-5 text-blue-500" /> Upcoming Schedule
              </h2>
              <div className="space-y-3">
                {events.slice(0, 5).map(event => (
                  <div key={event.id} className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-900/30 border border-slate-100 dark:border-slate-800 hover:border-blue-200 dark:hover:border-blue-800 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="w-11 h-11 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400">
                        <span className="text-[9px] font-black uppercase">{new Date(event.date).toLocaleString('default', { month: 'short' })}</span>
                        <span className="text-base font-black leading-none">{new Date(event.date).getDate()}</span>
                      </div>
                      <div>
                        <h4 className="font-semibold text-slate-800 dark:text-slate-100 text-sm">{event.title}</h4>
                        <p className="text-xs text-slate-500">{event.startTime} - {event.location || 'No location'}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 px-2 py-1 rounded-full uppercase">{event.type}</span>
                  </div>
                ))}
                {events.length === 0 && <p className="text-center py-8 text-slate-400 italic text-sm">No upcoming events.</p>}
              </div>
            </div>

            {/* Priority Tasks */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4 flex items-center gap-2">
                <CheckCircleIcon className="w-5 h-5 text-purple-500" /> Priority Tasks
              </h2>
              <div className="space-y-2">
                {myPendingTasks.sort((a, b) => { const p = { High: 0, Medium: 1, Low: 2 }; return (p[a.priority] || 2) - (p[b.priority] || 2); }).slice(0, 6).map(task => {
                  const isOverdue = new Date(task.dueDate) < today;
                  return (
                    <div key={task.id} className={`p-3 rounded-lg border ${isOverdue ? 'border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20' : 'border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30'}`}>
                      <div className="flex justify-between items-start">
                        <p className="text-sm font-medium text-slate-800 dark:text-slate-200 line-clamp-1">{task.description}</p>
                        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ml-2 flex-shrink-0 ${task.priority === 'High' ? 'bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400' : task.priority === 'Medium' ? 'bg-yellow-100 text-yellow-700' : 'bg-slate-100 text-slate-600'}`}>
                          {task.priority}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">Due: {task.dueDate} {isOverdue && <span className="text-red-500 font-bold">OVERDUE</span>}</p>
                    </div>
                  );
                })}
                {myPendingTasks.length === 0 && <p className="text-center py-4 text-slate-400 text-sm italic">All caught up!</p>}
              </div>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
            <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Recent Activity</h2>
            <div className="space-y-3">
              {activities.slice(0, 8).map(a => (
                <div key={a.id} className="flex items-center gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0" />
                  <span className="text-slate-700 dark:text-slate-300 flex-1">{a.description}</span>
                  <span className="text-xs text-slate-500 flex-shrink-0">{a.date ? new Date(a.date).toLocaleDateString() : ''}</span>
                </div>
              ))}
              {activities.length === 0 && <p className="text-slate-400 text-sm italic">No recent activity.</p>}
            </div>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Firm Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            <StatCard title="Revenue (YTD)" value={`$${totalRevenue.toLocaleString()}`} subtitle="Collected" icon={<CurrencyDollarIcon className="w-5 h-5 text-emerald-500" />} colorClass="text-emerald-500" onClick={() => navigate('/billing')} />
            <StatCard title="Outstanding A/R" value={`$${totalOutstanding.toLocaleString()}`} subtitle={`${invoices.filter(i => i.status !== 'Paid').length} invoices`} icon={<CreditCardIcon className="w-5 h-5 text-amber-500" />} colorClass="text-amber-500" onClick={() => navigate('/bills')} />
            <StatCard title="Trust Balance" value={`$${trustBalance.toLocaleString()}`} subtitle="IOLTA compliant" icon={<BanknotesIcon className="w-5 h-5 text-indigo-500" />} colorClass="text-indigo-500" />
            <StatCard title="WIP (Unbilled)" value={`$${wip.toLocaleString(undefined, { maximumFractionDigits: 0 })}`} subtitle="Time + expenses" icon={<ClockIcon className="w-5 h-5 text-blue-500" />} />
            <StatCard title="Realization Rate" value={`${realizationRate}%`} subtitle="Collected / billed" icon={<ChartBarIcon className="w-5 h-5 text-purple-500" />} colorClass={realizationRate >= 80 ? 'text-green-500' : 'text-amber-500'} />
            <StatCard title="Collection Rate" value={`${collectionRate}%`} subtitle="Billed & collected" icon={<ArrowTrendingUpIcon className="w-5 h-5 text-teal-500" />} colorClass={collectionRate >= 80 ? 'text-green-500' : 'text-amber-500'} />
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Revenue vs Expenses</h2>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <BarChart data={monthlyData}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: 'none', borderRadius: '12px', color: '#fff', fontSize: 12 }} />
                    <Legend />
                    <Bar dataKey="revenue" fill="#3b82f6" name="Revenue" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="expenses" fill="#f43f5e" name="Expenses" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-16">No financial data yet.</p>}
            </div>
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Matters by Practice Area</h2>
              {practiceAreaData.length > 0 ? (
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie data={practiceAreaData} cx="50%" cy="50%" innerRadius={55} outerRadius={80} paddingAngle={4} dataKey="value">
                      {practiceAreaData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                    <Legend verticalAlign="bottom" />
                  </PieChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-16">No matters yet.</p>}
            </div>
          </div>

          {/* AR Aging & New Matters Trend */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* AR Aging */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">A/R Aging</h2>
              <div className="grid grid-cols-4 gap-3">
                {[
                  { label: 'Current', amount: arAging.current, color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' },
                  { label: '31-60 Days', amount: arAging.days30, color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' },
                  { label: '61-90 Days', amount: arAging.days60, color: 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400' },
                  { label: '90+ Days', amount: arAging.days90, color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400' },
                ].map(b => (
                  <div key={b.label} className={`p-4 rounded-lg ${b.color} text-center`}>
                    <p className="text-xs font-bold uppercase mb-1">{b.label}</p>
                    <p className="text-lg font-black">${b.amount.toLocaleString()}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* New Matters Trend */}
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">New Matters Trend</h2>
              {newMattersTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={180}>
                  <AreaChart data={newMattersTrend}>
                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} />
                    <YAxis stroke="#94a3b8" fontSize={12} />
                    <Tooltip contentStyle={{ borderRadius: '12px', fontSize: 12 }} />
                    <Area type="monotone" dataKey="count" stroke="#8b5cf6" fill="#8b5cf680" name="New Matters" />
                  </AreaChart>
                </ResponsiveContainer>
              ) : <p className="text-slate-400 text-sm text-center py-12">No trend data yet.</p>}
            </div>
          </div>

          {/* Top Clients & Pipeline */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Top Clients by Revenue</h2>
              {topClients.length > 0 ? (
                <div className="space-y-3">
                  {topClients.map((c, i) => (
                    <div key={c.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-200">{c.name}</span>
                      </div>
                      <span className="text-sm font-bold text-slate-800 dark:text-slate-200">${c.revenue.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : <p className="text-slate-400 text-sm text-center py-8">No revenue data yet.</p>}
            </div>

            <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-slate-200 dark:border-slate-700">
              <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 mb-4">Intake Pipeline</h2>
              <div className="space-y-3">
                {(['New Lead', 'Consultation Scheduled', 'Awaiting Signature', 'Converted', 'Lost'] as const).map(stage => {
                  const count = potentialClients.filter(p => p.status === stage).length;
                  const total = potentialClients.length || 1;
                  const pct = Math.round((count / total) * 100);
                  const colors: Record<string, string> = { 'New Lead': 'bg-blue-500', 'Consultation Scheduled': 'bg-purple-500', 'Awaiting Signature': 'bg-yellow-500', 'Converted': 'bg-green-500', 'Lost': 'bg-slate-400' };
                  return (
                    <div key={stage}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-slate-600 dark:text-slate-400 font-medium">{stage}</span>
                        <span className="text-slate-800 dark:text-slate-200 font-bold">{count}</span>
                      </div>
                      <div className="w-full bg-slate-100 dark:bg-slate-700 rounded-full h-2">
                        <div className={`h-2 rounded-full transition-all ${colors[stage] || 'bg-blue-500'}`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {potentialClients.length === 0 && <p className="text-slate-400 text-sm text-center py-4">No leads in pipeline.</p>}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
