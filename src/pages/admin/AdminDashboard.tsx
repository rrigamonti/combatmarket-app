import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { db } from '@/integrations/supabase/db';
import { Users, Target, ClipboardCheck } from 'lucide-react';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ merchants: 0, activeMissions: 0, pendingReviews: 0 });

  useEffect(() => {
    const fetchStats = async () => {
      const { count: mc } = await db.from('merchants').select('*', { count: 'exact', head: true });
      const { count: mis } = await db.from('missions').select('*', { count: 'exact', head: true }).eq('status', 'active');
      const { count: sub } = await db.from('submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending');
      setStats({ merchants: mc || 0, activeMissions: mis || 0, pendingReviews: sub || 0 });
    };
    fetchStats();
  }, []);

  const cards = [
    { title: 'Total Merchants', value: stats.merchants, icon: Users, color: 'text-primary' },
    { title: 'Active Missions', value: stats.activeMissions, icon: Target, color: 'text-green-400' },
    { title: 'Pending Reviews', value: stats.pendingReviews, icon: ClipboardCheck, color: 'text-yellow-400' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Admin Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-display">{c.value}</div></CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default AdminDashboard;
