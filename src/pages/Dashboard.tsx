import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Wallet, Target, ClipboardCheck, CreditCard, Plus, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface BalanceData {
  total_balance: number;
  reserved_balance: number;
  available_balance: number;
}

const Dashboard = () => {
  const { merchantId } = useAuth();
  const navigate = useNavigate();
  const [balance, setBalance] = useState<BalanceData>({ total_balance: 0, reserved_balance: 0, available_balance: 0 });
  const [missionCount, setMissionCount] = useState(0);
  const [pendingSubmissions, setPendingSubmissions] = useState(0);

  useEffect(() => {
    if (!merchantId) return;
    const fetchData = async () => {
      const { data: balData } = await db.rpc('get_merchant_balance', { _merchant_id: merchantId });
      if (balData && Array.isArray(balData) && balData.length > 0) {
        setBalance(balData[0] as BalanceData);
      }
      const { count: mc } = await db.from('missions').select('*', { count: 'exact', head: true }).eq('merchant_id', merchantId).eq('status', 'active');
      setMissionCount(mc || 0);
      const { count: sc } = await db.from('submissions').select('*, missions!inner(merchant_id)', { count: 'exact', head: true }).eq('missions.merchant_id', merchantId).eq('status', 'pending');
      setPendingSubmissions(sc || 0);
    };
    fetchData();
  }, [merchantId]);

  const stats = [
    { title: 'Available Balance', value: `$${balance.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: Wallet, color: 'text-green-400' },
    { title: 'Active Missions', value: missionCount.toString(), icon: Target, color: 'text-primary' },
    { title: 'Pending Reviews', value: pendingSubmissions.toString(), icon: ClipboardCheck, color: 'text-yellow-400' },
    { title: 'Reserved Float', value: `$${balance.reserved_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, icon: CreditCard, color: 'text-muted-foreground' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Dashboard</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => navigate('/merchant/float')}><ArrowUpRight className="h-4 w-4 mr-1" /> Top Up</Button>
          <Button onClick={() => navigate('/merchant/missions/create')}><Plus className="h-4 w-4 mr-1" /> New Mission</Button>
        </div>
      </div>
      {!merchantId && (
        <Card className="border-primary/50"><CardContent className="pt-6"><p className="text-muted-foreground">You're not linked to a merchant yet. Contact an admin to get set up.</p></CardContent></Card>
      )}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map(stat => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent><div className="text-2xl font-bold font-display">{stat.value}</div></CardContent>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card><CardHeader><CardTitle className="font-display text-lg">Recent Activity</CardTitle></CardHeader><CardContent><p className="text-sm text-muted-foreground">No recent activity to display.</p></CardContent></Card>
        <Card><CardHeader><CardTitle className="font-display text-lg">Quick Actions</CardTitle></CardHeader>
          <CardContent className="space-y-2">
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/merchant/missions/create')}><Target className="h-4 w-4 mr-2" /> Create a Mission</Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => navigate('/merchant/float')}><Wallet className="h-4 w-4 mr-2" /> View Float Balance</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
