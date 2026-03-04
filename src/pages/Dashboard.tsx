import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Wallet, Target, ClipboardCheck, CreditCard, Plus, ArrowUpRight, ArrowRight, BarChart3, Settings, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BalanceData { total_balance: number; reserved_balance: number; available_balance: number; }
interface RecentMission { id: string; name: string; status: string; mission_type: string; current_participants: number; max_participants: number | null; budget: number | null; }
interface RecentSubmission { id: string; status: string; payout_amount: number | null; created_at: string; evidence_type: string | null; fighter_id: string; }

const Dashboard = () => {
  const { merchantId, user } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<BalanceData>({ total_balance: 0, reserved_balance: 0, available_balance: 0 });
  const [missionCount, setMissionCount] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);
  const [recentMissions, setRecentMissions] = useState<RecentMission[]>([]);
  const [recentSubs, setRecentSubs] = useState<RecentSubmission[]>([]);
  const [merchantStatus, setMerchantStatus] = useState<string>('');

  useEffect(() => {
    if (!merchantId) return;
    const fetchData = async () => {
      const { data: balData } = await db.rpc('get_merchant_balance', { _merchant_id: merchantId });
      if (balData && Array.isArray(balData) && balData.length > 0) setBalance(balData[0] as BalanceData);

      const { data: merchant } = await db.from('merchants').select('status').eq('id', merchantId).single();
      if (merchant) setMerchantStatus((merchant as any).status);

      const { count: mc } = await db.from('missions').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'active');
      setMissionCount(mc || 0);

      const { count: sc } = await db.from('submissions').select('*, missions!inner(merchant_id)', { count: 'exact', head: true }).eq('missions.merchant_id', merchantId).eq('status', 'pending');
      setPendingSubmissions(sc || 0);

      const { data: missions } = await db.from('missions').select('id, name, status, mission_type, current_participants, max_participants, budget').eq('merchant_id', merchantId).order('created_at', { ascending: false }).limit(5);
      setRecentMissions((missions as RecentMission[]) || []);

      const { data: subs } = await db.from('submissions').select('id, status, payout_amount, created_at, evidence_type, fighter_id, missions!inner(merchant_id)').eq('missions.merchant_id', merchantId).order('created_at', { ascending: false }).limit(5);
      setRecentSubs((subs as any[] || []).map((s: any) => ({
        id: s.id, status: s.status, payout_amount: s.payout_amount,
        created_at: s.created_at, evidence_type: s.evidence_type, fighter_id: s.fighter_id,
      })));
    };
    fetchData();
  }, [merchantId]);

  const stats = [
    { title: 'Available', value: `$${balance.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-green-400' },
    { title: 'Missions', value: missionCount.toString(), icon: Target, color: 'text-primary' },
    { title: 'Reviews', value: pendingSubmissions.toString(), icon: ClipboardCheck, color: 'text-yellow-400' },
    { title: 'Reserved', value: `$${balance.reserved_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-muted-foreground' },
  ];

  const missionStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'default' as const;
      case 'draft': return 'secondary' as const;
      case 'paused': return 'outline' as const;
      case 'closed': return 'destructive' as const;
      default: return 'secondary' as const;
    }
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-xl md:text-2xl font-display">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate('/merchant/float')} className="min-h-[44px]">
            <ArrowUpRight className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">Top Up</span>
          </Button>
          <Button size="sm" onClick={() => navigate('/merchant/missions/create')} className="min-h-[44px]">
            <Plus className="h-4 w-4 mr-1" /> <span className="hidden sm:inline">New Mission</span>
          </Button>
        </div>
      </div>

      {/* Pending banner */}
      {merchantStatus === 'pending' && (
        <Card className="border-yellow-500/50 bg-yellow-500/5">
          <CardContent className="py-3 px-4">
            <p className="text-yellow-400 text-sm">⏳ Account pending approval. Some features may be limited.</p>
          </CardContent>
        </Card>
      )}

      {!merchantId && (
        <Card className="border-primary/50">
          <CardContent className="py-3 px-4">
            <p className="text-muted-foreground text-sm">You're not linked to a merchant yet. Contact an admin.</p>
          </CardContent>
        </Card>
      )}

      {/* Stats - 2x2 on mobile */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-1 px-3 pt-3 md:px-6 md:pt-6">
              <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent className="px-3 pb-3 md:px-6 md:pb-6">
              <div className="text-lg md:text-2xl font-bold font-display">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Content - stack on mobile, side by side on desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Recent Missions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-display text-base md:text-lg">Missions</CardTitle>
              <CardDescription className="text-xs">Your campaigns</CardDescription>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/merchant/missions')} className="min-h-[44px]">
              All <ArrowRight className="h-4 w-4 ml-1" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {recentMissions.length === 0 ? (
              <div className="text-center py-6">
                <Target className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No missions yet</p>
                <Button variant="link" size="sm" onClick={() => navigate('/merchant/missions/create')} className="min-h-[44px]">
                  Create your first mission
                </Button>
              </div>
            ) : recentMissions.map(m => (
              <button
                key={m.id}
                className="w-full flex items-center justify-between p-3 rounded-lg bg-secondary/50 hover:bg-secondary/80 active:bg-secondary transition-colors text-left min-h-[56px]"
                onClick={() => navigate(`/merchant/missions/${m.id}`)}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{m.name}</p>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] text-muted-foreground uppercase">{m.mission_type}</span>
                    <span className="text-[10px] text-muted-foreground">{m.current_participants}/{m.max_participants || '∞'}</span>
                  </div>
                </div>
                <Badge variant={missionStatusColor(m.status)} className="ml-2 shrink-0 text-[10px]">{m.status}</Badge>
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Recent Submissions */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div>
              <CardTitle className="font-display text-base md:text-lg">Submissions</CardTitle>
              <CardDescription className="text-xs">Fighter evidence</CardDescription>
            </div>
            {pendingSubmissions > 0 && (
              <Badge variant="default" className="shrink-0">{pendingSubmissions}</Badge>
            )}
          </CardHeader>
          <CardContent className="space-y-2">
            {recentSubs.length === 0 ? (
              <div className="text-center py-6">
                <ClipboardCheck className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                <p className="text-sm text-muted-foreground">No submissions yet</p>
              </div>
            ) : recentSubs.map(s => (
              <div key={s.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 min-h-[48px]">
                <div>
                  <p className="text-sm">{new Date(s.created_at).toLocaleDateString()}</p>
                  <p className="text-[10px] text-muted-foreground uppercase">{s.evidence_type || 'N/A'}</p>
                </div>
                <div className="flex items-center gap-2">
                  {s.payout_amount && <span className="text-xs font-mono text-green-400">${s.payout_amount}</span>}
                  <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'} className="text-[10px]">
                    {s.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions - desktop only, mobile uses bottom nav */}
      <div className="hidden md:block">
        <Card>
          <CardHeader><CardTitle className="font-display text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="grid grid-cols-5 gap-3">
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/merchant/missions/create')}>
              <Plus className="h-6 w-6 text-primary" /><span className="text-xs">Create Mission</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/merchant/missions')}>
              <Eye className="h-6 w-6 text-primary" /><span className="text-xs">View Missions</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/merchant/float')}>
              <Wallet className="h-6 w-6 text-green-400" /><span className="text-xs">Float</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/merchant/reports')}>
              <BarChart3 className="h-6 w-6 text-yellow-400" /><span className="text-xs">Reports</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex flex-col items-center gap-2" onClick={() => navigate('/merchant/settings')}>
              <Settings className="h-6 w-6 text-muted-foreground" /><span className="text-xs">Settings</span>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
