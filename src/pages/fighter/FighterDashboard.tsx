import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Target, Trophy, ClipboardCheck, ArrowRight, Swords, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface RecentSubmission {
  id: string;
  status: string;
  payout_amount: number | null;
  created_at: string;
  mission_id: string;
}

interface ActiveMission {
  id: string;
  mission_id: string;
  status: string;
  mission: { name: string; reward_per_participant: number | null; mission_type: string } | null;
}

const FighterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [stats, setStats] = useState({ activeMissions: 0, pendingSubmissions: 0, totalEarnings: 0, approvedCount: 0, rejectedCount: 0 });
  const [recentSubmissions, setRecentSubmissions] = useState<RecentSubmission[]>([]);
  const [activeMissions, setActiveMissions] = useState<ActiveMission[]>([]);
  const [availableMissionCount, setAvailableMissionCount] = useState(0);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const { data: participations } = await db
        .from('mission_participations')
        .select('id, mission_id, status, missions(name, reward_per_participant, mission_type)')
        .eq('fighter_id', user.id)
        .in('status', ['joined', 'started', 'submitted']);

      const mapped = ((participations as any[]) || []).map((p: any) => ({
        id: p.id, mission_id: p.mission_id, status: p.status, mission: p.missions,
      }));
      setActiveMissions(mapped.slice(0, 5));

      const { data: allSubs } = await db
        .from('submissions')
        .select('id, status, payout_amount, created_at, mission_id')
        .eq('fighter_id', user.id)
        .order('created_at', { ascending: false });

      const subs = (allSubs as RecentSubmission[]) || [];
      setRecentSubmissions(subs.slice(0, 5));

      const pendingCount = subs.filter(s => s.status === 'pending').length;
      const approvedCount = subs.filter(s => s.status === 'approved').length;
      const totalEarnings = subs.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.payout_amount || 0), 0);

      const { count: available } = await db
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setAvailableMissionCount(available || 0);
      setStats({ activeMissions: mapped.length, pendingSubmissions: pendingCount, totalEarnings, approvedCount, rejectedCount: subs.filter(s => s.status === 'rejected').length });
    };
    fetchData();
  }, [user]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'rejected': return <XCircle className="h-4 w-4 text-destructive" />;
      default: return <Clock className="h-4 w-4 text-yellow-400" />;
    }
  };

  const cards = [
    { title: 'Active', value: stats.activeMissions.toString(), icon: Target, color: 'text-primary' },
    { title: 'Pending', value: stats.pendingSubmissions.toString(), icon: ClipboardCheck, color: 'text-yellow-400' },
    { title: 'Approved', value: stats.approvedCount.toString(), icon: CheckCircle, color: 'text-green-400' },
    { title: 'Earned', value: `$${stats.totalEarnings.toFixed(2)}`, icon: Trophy, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-primary" />
          <h1 className="text-xl md:text-2xl font-display">Fighter</h1>
        </div>
        <Button size="sm" onClick={() => navigate('/fighter/missions')} className="min-h-[44px] px-4">
          <Target className="h-4 w-4 mr-1" /> Missions
        </Button>
      </div>

      {/* Stats - 2x2 on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {cards.map(c => (
          <Card key={c.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 md:px-6 md:pt-6">
              <CardTitle className="text-xs md:text-sm text-muted-foreground">{c.title}</CardTitle>
              <c.icon className={`h-4 w-4 md:h-5 md:w-5 ${c.color}`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
              <div className="text-xl md:text-2xl font-bold font-display">{c.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Active Missions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-display text-base md:text-lg">My Missions</CardTitle>
            <CardDescription className="text-xs">Missions you've joined</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/fighter/missions')} className="min-h-[44px]">
            All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {activeMissions.length === 0 ? (
            <div className="text-center py-6">
              <Target className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No active missions</p>
              <Button variant="link" size="sm" onClick={() => navigate('/fighter/missions')} className="min-h-[44px]">
                Browse {availableMissionCount} available
              </Button>
            </div>
          ) : activeMissions.map(m => (
            <button
              key={m.id}
              className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 active:bg-secondary transition-colors text-left min-h-[56px]"
              onClick={() => navigate(`/fighter/missions/${m.mission_id}`)}
            >
              <div className="flex-1 min-w-0">
                <p className="font-medium text-sm truncate">{m.mission?.name || 'Mission'}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="outline" className="text-[10px] uppercase">{m.mission?.mission_type}</Badge>
                  {m.mission?.reward_per_participant && (
                    <span className="text-xs text-green-400 font-mono">${m.mission.reward_per_participant}</span>
                  )}
                </div>
              </div>
              <Badge variant={m.status === 'submitted' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                {m.status}
              </Badge>
            </button>
          ))}
        </CardContent>
      </Card>

      {/* Recent Submissions */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-display text-base md:text-lg">Recent Submissions</CardTitle>
            <CardDescription className="text-xs">Latest evidence</CardDescription>
          </div>
          <Button variant="ghost" size="sm" onClick={() => navigate('/fighter/earnings')} className="min-h-[44px]">
            All <ArrowRight className="h-4 w-4 ml-1" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {recentSubmissions.length === 0 ? (
            <div className="text-center py-6">
              <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No submissions yet</p>
            </div>
          ) : recentSubmissions.map(s => (
            <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 min-h-[48px]">
              <div className="flex items-center gap-2">
                {statusIcon(s.status)}
                <span className="text-sm">{new Date(s.created_at).toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-2">
                {s.payout_amount && s.status === 'approved' && (
                  <span className="text-sm font-mono text-green-400">${s.payout_amount.toFixed(2)}</span>
                )}
                <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>
                  {s.status}
                </Badge>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Quick Actions - hidden on mobile since bottom nav covers it */}
      <div className="hidden md:block">
        <Card>
          <CardHeader>
            <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-3 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/fighter/missions')}>
              <Target className="h-6 w-6 text-primary" />
              <span>Browse Missions</span>
              <span className="text-xs text-muted-foreground">{availableMissionCount} available</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/fighter/earnings')}>
              <Trophy className="h-6 w-6 text-green-400" />
              <span>My Earnings</span>
              <span className="text-xs text-muted-foreground">${stats.totalEarnings.toFixed(2)} earned</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/fighter/missions')}>
              <ClipboardCheck className="h-6 w-6 text-yellow-400" />
              <span>Pending</span>
              <span className="text-xs text-muted-foreground">{stats.pendingSubmissions} awaiting</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FighterDashboard;
