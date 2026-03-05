import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/supabase/db';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { DollarSign, Users, Target, TrendingUp } from 'lucide-react';

const COLORS = ['hsl(var(--primary))', 'hsl(var(--chart-2))', 'hsl(var(--chart-3))', 'hsl(var(--chart-4))', 'hsl(var(--chart-5))'];

const AdminAnalytics = () => {
  const [revenueByMerchant, setRevenueByMerchant] = useState<any[]>([]);
  const [missionStatus, setMissionStatus] = useState<any[]>([]);
  const [fighterPerformance, setFighterPerformance] = useState<any[]>([]);
  const [monthlyTrends, setMonthlyTrends] = useState<any[]>([]);
  const [totals, setTotals] = useState({ totalRevenue: 0, totalFighters: 0, totalMissions: 0, approvalRate: 0 });

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    // Revenue by merchant (topups = revenue deposited)
    const { data: ledger } = await db.from('float_ledger').select('merchant_id, amount, entry_type, created_at').eq('status', 'posted');
    const { data: merchants } = await db.from('merchants').select('id, name');
    const { data: missions } = await db.from('missions').select('id, status, merchant_id, created_at, name');
    const { data: submissions } = await db.from('submissions').select('id, fighter_id, status, payout_amount, created_at, mission_id');
    const { data: profiles } = await db.from('profiles').select('id, full_name, email');
    const { data: fighterRoles } = await db.from('user_roles').select('user_id').eq('role', 'fighter');

    const merchantMap = new Map((merchants || []).map(m => [m.id, m.name]));
    const profileMap = new Map((profiles || []).map(p => [p.id, p.full_name || p.email || p.id.slice(0, 8)]));
    const fighterIds = new Set((fighterRoles || []).map(r => r.user_id));

    // Revenue by merchant
    const revMap = new Map<string, number>();
    (ledger || []).filter(e => e.entry_type === 'topup').forEach(e => {
      const name = merchantMap.get(e.merchant_id) || 'Unknown';
      revMap.set(name, (revMap.get(name) || 0) + Number(e.amount));
    });
    setRevenueByMerchant(Array.from(revMap.entries()).map(([name, amount]) => ({ name, amount })));

    // Mission status counts
    const statusCounts = new Map<string, number>();
    (missions || []).forEach(m => statusCounts.set(m.status, (statusCounts.get(m.status) || 0) + 1));
    setMissionStatus(Array.from(statusCounts.entries()).map(([name, value]) => ({ name, value })));

    // Fighter performance
    const fighterStats = new Map<string, { approved: number; total: number; earnings: number }>();
    (submissions || []).forEach(s => {
      if (!fighterStats.has(s.fighter_id)) fighterStats.set(s.fighter_id, { approved: 0, total: 0, earnings: 0 });
      const st = fighterStats.get(s.fighter_id)!;
      st.total++;
      if (s.status === 'approved') { st.approved++; st.earnings += Number(s.payout_amount || 0); }
    });
    const topFighters = Array.from(fighterStats.entries())
      .sort((a, b) => b[1].approved - a[1].approved)
      .slice(0, 10)
      .map(([id, st]) => ({
        name: profileMap.get(id) || id.slice(0, 8),
        approved: st.approved,
        total: st.total,
        earnings: st.earnings,
        rate: st.total > 0 ? Math.round((st.approved / st.total) * 100) : 0,
      }));
    setFighterPerformance(topFighters);

    // Monthly trends
    const monthMap = new Map<string, { missions: number; submissions: number; revenue: number }>();
    (missions || []).forEach(m => {
      const month = m.created_at.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { missions: 0, submissions: 0, revenue: 0 });
      monthMap.get(month)!.missions++;
    });
    (submissions || []).forEach(s => {
      const month = s.created_at.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { missions: 0, submissions: 0, revenue: 0 });
      monthMap.get(month)!.submissions++;
    });
    (ledger || []).filter(e => e.entry_type === 'topup').forEach(e => {
      const month = e.created_at.slice(0, 7);
      if (!monthMap.has(month)) monthMap.set(month, { missions: 0, submissions: 0, revenue: 0 });
      monthMap.get(month)!.revenue += Number(e.amount);
    });
    setMonthlyTrends(Array.from(monthMap.entries()).sort().map(([month, d]) => ({ month, ...d })));

    // Totals
    const totalRev = (ledger || []).filter(e => e.entry_type === 'topup').reduce((s, e) => s + Number(e.amount), 0);
    const totalSubs = (submissions || []).length;
    const approvedSubs = (submissions || []).filter(s => s.status === 'approved').length;
    setTotals({
      totalRevenue: totalRev,
      totalFighters: fighterIds.size,
      totalMissions: (missions || []).length,
      approvalRate: totalSubs > 0 ? Math.round((approvedSubs / totalSubs) * 100) : 0,
    });
  };

  const summaryCards = [
    { title: 'Total Revenue', value: `$${totals.totalRevenue.toLocaleString()}`, icon: DollarSign, color: 'text-green-500' },
    { title: 'Total Fighters', value: totals.totalFighters, icon: Users, color: 'text-primary' },
    { title: 'Total Missions', value: totals.totalMissions, icon: Target, color: 'text-blue-500' },
    { title: 'Approval Rate', value: `${totals.approvalRate}%`, icon: TrendingUp, color: 'text-yellow-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-display">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Merchant */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Revenue by Merchant</CardTitle></CardHeader>
          <CardContent className="h-64">
            {revenueByMerchant.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenueByMerchant}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(v: number) => [`$${v.toLocaleString()}`, 'Revenue']} />
                  <Bar dataKey="amount" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center pt-20">No revenue data yet</p>}
          </CardContent>
        </Card>

        {/* Mission Status */}
        <Card>
          <CardHeader><CardTitle className="text-lg font-display">Mission Status</CardTitle></CardHeader>
          <CardContent className="h-64">
            {missionStatus.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={missionStatus} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, value }) => `${name}: ${value}`}>
                    {missionStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center pt-20">No missions yet</p>}
          </CardContent>
        </Card>

        {/* Monthly Trends */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg font-display">Monthly Trends</CardTitle></CardHeader>
          <CardContent className="h-64">
            {monthlyTrends.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={monthlyTrends}>
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Line type="monotone" dataKey="missions" stroke="hsl(var(--primary))" name="Missions" strokeWidth={2} />
                  <Line type="monotone" dataKey="submissions" stroke="hsl(var(--chart-2))" name="Submissions" strokeWidth={2} />
                </LineChart>
              </ResponsiveContainer>
            ) : <p className="text-muted-foreground text-sm text-center pt-20">No trend data yet</p>}
          </CardContent>
        </Card>

        {/* Top Fighters */}
        <Card className="lg:col-span-2">
          <CardHeader><CardTitle className="text-lg font-display">Top Fighters</CardTitle></CardHeader>
          <CardContent>
            {fighterPerformance.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground">
                    <th className="text-left py-2">Fighter</th>
                    <th className="text-right py-2">Approved</th>
                    <th className="text-right py-2">Total</th>
                    <th className="text-right py-2">Rate</th>
                    <th className="text-right py-2">Earnings</th>
                  </tr></thead>
                  <tbody>
                    {fighterPerformance.map(f => (
                      <tr key={f.name} className="border-b border-border/50">
                        <td className="py-2 font-medium">{f.name}</td>
                        <td className="text-right py-2">{f.approved}</td>
                        <td className="text-right py-2">{f.total}</td>
                        <td className="text-right py-2">{f.rate}%</td>
                        <td className="text-right py-2">${f.earnings.toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : <p className="text-muted-foreground text-sm">No fighter data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminAnalytics;
