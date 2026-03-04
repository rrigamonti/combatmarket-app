import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Target, Trophy, ClipboardCheck } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const FighterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeMissions: 0, pendingSubmissions: 0, totalEarnings: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { count: missions } = await db
        .from('mission_participations')
        .select('*', { count: 'exact', head: true })
        .eq('fighter_id', user.id)
        .in('status', ['joined', 'started']);

      const { count: pending } = await db
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('fighter_id', user.id)
        .eq('status', 'pending');

      const { data: earnings } = await db
        .from('submissions')
        .select('payout_amount')
        .eq('fighter_id', user.id)
        .eq('status', 'approved');

      const totalEarnings = (earnings as any[] || []).reduce((sum: number, s: any) => sum + (s.payout_amount || 0), 0);

      setStats({
        activeMissions: missions || 0,
        pendingSubmissions: pending || 0,
        totalEarnings,
      });
    };
    fetchData();
  }, [user]);

  const cards = [
    { title: 'Active Missions', value: stats.activeMissions.toString(), icon: Target, color: 'text-primary' },
    { title: 'Pending Submissions', value: stats.pendingSubmissions.toString(), icon: ClipboardCheck, color: 'text-yellow-400' },
    { title: 'Total Earned', value: `$${stats.totalEarnings.toFixed(2)}`, icon: Trophy, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Fighter Dashboard</h1>
        <Button onClick={() => navigate('/fighter/missions')}>
          <Target className="h-4 w-4 mr-1" /> Browse Missions
        </Button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-5 w-5 ${c.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-display">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default FighterDashboard;
