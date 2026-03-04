import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Download, Plus } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

interface LedgerEntry { id: string; entry_type: string; amount: number; status: string; reference: string | null; description: string | null; created_at: string; }
interface BalanceData { total_balance: number; reserved_balance: number; available_balance: number; }

const FloatPage = () => {
  const { merchantId } = useAuth();
  const [balance, setBalance] = useState<BalanceData>({ total_balance: 0, reserved_balance: 0, available_balance: 0 });
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [filterType, setFilterType] = useState<string>('all');
  const [topUpAmount, setTopUpAmount] = useState('');
  const [topUpOpen, setTopUpOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    if (!merchantId) return;
    const { data: balData } = await db.rpc('get_merchant_balance', { _merchant_id: merchantId });
    if (balData && Array.isArray(balData) && balData.length > 0) setBalance(balData[0] as BalanceData);
    let query = db.from('float_ledger').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
    if (filterType !== 'all') query = query.eq('entry_type', filterType);
    const { data } = await query;
    setEntries((data as LedgerEntry[]) || []);
  };

  useEffect(() => { fetchData(); }, [merchantId, filterType]);

  const handleTopUp = async () => {
    if (!merchantId || !topUpAmount) return;
    setLoading(true);
    try {
      const amount = parseFloat(topUpAmount);
      if (isNaN(amount) || amount <= 0) throw new Error('Invalid amount');
      const { error } = await db.from('float_ledger').insert({
        merchant_id: merchantId, entry_type: 'topup', amount, status: 'pending',
        reference: `TOPUP-${Date.now()}`, description: `Top-up request for $${amount.toFixed(2)}`,
        idempotency_key: `topup-${merchantId}-${Date.now()}`,
        created_by: (await db.auth.getUser()).data.user?.id,
      });
      if (error) throw error;
      toast.success('Top-up request submitted!');
      setTopUpAmount(''); setTopUpOpen(false); fetchData();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const exportCSV = () => {
    const headers = ['Date', 'Type', 'Amount', 'Status', 'Reference', 'Description'];
    const rows = entries.map(e => [new Date(e.created_at).toLocaleDateString(), e.entry_type, e.amount.toFixed(2), e.status, e.reference || '', e.description || '']);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `float-ledger-${Date.now()}.csv`; a.click();
  };

  const typeColor = (type: string) => {
    switch (type) { case 'topup': return 'text-green-400'; case 'reserve': return 'text-yellow-400'; case 'release': return 'text-blue-400'; case 'payout': return 'text-primary'; default: return 'text-muted-foreground'; }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Float Account</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Export CSV</Button>
          <Dialog open={topUpOpen} onOpenChange={setTopUpOpen}>
            <DialogTrigger asChild><Button><Plus className="h-4 w-4 mr-1" /> Top Up</Button></DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle className="font-display">Request Top-Up</DialogTitle></DialogHeader>
              <div className="space-y-4 pt-4">
                <div className="space-y-2"><Label>Amount (USD)</Label><Input type="number" min="1" step="0.01" value={topUpAmount} onChange={e => setTopUpAmount(e.target.value)} placeholder="500.00" /></div>
                <Button onClick={handleTopUp} disabled={loading} className="w-full">{loading ? 'Submitting...' : 'Submit Top-Up Request'}</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Total Balance</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display">${balance.total_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></CardContent></Card>
        <Card className="border-yellow-500/30"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Reserved</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display text-yellow-400">${balance.reserved_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></CardContent></Card>
        <Card className="border-green-500/30"><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Available</CardTitle></CardHeader><CardContent><div className="text-2xl font-bold font-display text-green-400">${balance.available_balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="font-display text-lg">Ledger</CardTitle>
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-40"><SelectValue placeholder="Filter type" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem><SelectItem value="topup">Top Up</SelectItem><SelectItem value="reserve">Reserve</SelectItem>
              <SelectItem value="release">Release</SelectItem><SelectItem value="payout">Payout</SelectItem><SelectItem value="adjustment">Adjustment</SelectItem>
            </SelectContent>
          </Select>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Type</TableHead><TableHead>Amount</TableHead><TableHead>Status</TableHead><TableHead>Reference</TableHead><TableHead>Description</TableHead></TableRow></TableHeader>
            <TableBody>
              {entries.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">No ledger entries yet</TableCell></TableRow>
              ) : entries.map(entry => (
                <TableRow key={entry.id}>
                  <TableCell className="text-sm">{new Date(entry.created_at).toLocaleDateString()}</TableCell>
                  <TableCell><span className={`uppercase text-xs font-semibold ${typeColor(entry.entry_type)}`}>{entry.entry_type}</span></TableCell>
                  <TableCell className="font-mono">${entry.amount.toFixed(2)}</TableCell>
                  <TableCell><Badge variant={entry.status === 'posted' ? 'default' : 'secondary'}>{entry.status}</Badge></TableCell>
                  <TableCell className="text-sm text-muted-foreground">{entry.reference || '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{entry.description || '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FloatPage;
