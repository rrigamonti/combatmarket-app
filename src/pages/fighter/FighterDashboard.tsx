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
      // Active participations with mission info
      const { data: participations } = await db
        .from('mission_participations')
        .select('id, mission_id, status, missions(name, reward_per_participant, mission_type)')
        .eq('fighter_id', user.id)
        .in('status', ['joined', 'started', 'submitted']);

      const mapped = ((participations as any[]) || []).map((p: any) => ({
        id: p.id,
        mission_id: p.mission_id,
        status: p.status,
        mission: p.missions,
      }));
      setActiveMissions(mapped.slice(0, 5));

      // Submissions stats
      const { data: allSubs } = await db
        .from('submissions')
        .select('id, status, payout_amount, created_at, mission_id')
        .eq('fighter_id', user.id)
        .order('created_at', { ascending: false });

      const subs = (allSubs as RecentSubmission[]) || [];
      setRecentSubmissions(subs.slice(0, 5));

      const pendingCount = subs.filter(s => s.status === 'pending').length;
      const approvedCount = subs.filter(s => s.status === 'approved').length;
      const rejectedCount = subs.filter(s => s.status === 'rejected').length;
      const totalEarnings = subs.filter(s => s.status === 'approved').reduce((sum, s) => sum + (s.payout_amount || 0), 0);

      // Available missions count
      const { count: available } = await db
        .from('missions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setAvailableMissionCount(available || 0);

      setStats({
        activeMissions: mapped.length,
        pendingSubmissions: pendingCount,
        totalEarnings,
        approvedCount,
        rejectedCount,
      });
    };
    fetchData();
  }, [user]);

  const statusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-3.5 w-3.5 text-green-400" />;
      case 'rejected': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      default: return <Clock className="h-3.5 w-3.5 text-yellow-400" />;
    }
  };

  const cards = [
    { title: 'Active Missions', value: stats.activeMissions.toString(), icon: Target, color: 'text-primary' },
    { title: 'Pending Reviews', value: stats.pendingSubmissions.toString(), icon: ClipboardCheck, color: 'text-yellow-400' },
    { title: 'Approved', value: stats.approvedCount.toString(), icon: CheckCircle, color: 'text-green-400' },
    { title: 'Total Earned', value: `$${stats.totalEarnings.toFixed(2)}`, icon: Trophy, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Swords className="h-7 w-7 text-primary" />
          <h1 className="text-2xl font-display">Fighter Dashboard</h1>
        </div>
        <Button onClick={() => navigate('/fighter/missions')}>
          <Target className="h-4 w-4 mr-1" /> Browse Missions
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">My Active Missions</CardTitle>
              <CardDescription>Missions you've joined</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/fighter/missions')}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {activeMissions.length === 0 ? (
              <div className="text-center py-6">
                <Target className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No active missions</p>
                <Button variant="link" size="sm" onClick={() => navigate('/fighter/missions')}>
                  Browse {availableMissionCount} available missions
                </Button>
              </div>
            ) : activeMissions.map(m => (
              <div
                key={m.id}
                className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 cursor-pointer transition-colors"
                onClick={() => navigate(`/fighter/missions/${m.mission_id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.mission?.name || 'Mission'}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs uppercase">{m.mission?.mission_type}</Badge>
                    {m.mission?.reward_per_participant && (
                      <span className="text-xs text-green-400 font-mono">${m.mission.reward_per_participant}</span>
                    )}
                  </div>
                </div>
                <Badge variant={m.status === 'submitted' ? 'default' : 'secondary'} className="ml-2 shrink-0">
                  {m.status}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="font-display text-lg">Recent Submissions</CardTitle>
              <CardDescription>Your latest evidence submissions</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/fighter/earnings')}>
              View All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {recentSubmissions.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardCheck className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No submissions yet</p>
                <p className="text-xs text-muted-foreground">Join a mission and submit evidence to start earning</p>
              </div>
            ) : recentSubmissions.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2">
                  {statusIcon(s.status)}
                  <div>
                    <p className="text-sm">{new Date(s.created_at).toLocaleDateString()}</p>
                  </div>
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
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="font-display text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 sm:grid-cols-3 gap-3">
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
            <span>Pending Reviews</span>
            <span className="text-xs text-muted-foreground">{stats.pendingSubmissions} awaiting</span>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FighterDashboard;
