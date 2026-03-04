import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';

const AdminPayouts = () => {
  const [approvedSubs, setApprovedSubs] = useState<any[]>([]);

  const fetchPayouts = async () => {
    const { data } = await db.from('submissions').select('*, missions(name, merchant_id, reward_per_participant)').eq('status', 'approved').is('paid_at', null).order('created_at', { ascending: false });
    setApprovedSubs(data || []);
  };

  useEffect(() => { fetchPayouts(); }, []);

  const processPayout = async (sub: any) => {
    const user = (await db.auth.getUser()).data.user;
    const amount = sub.missions?.reward_per_participant || sub.payout_amount || 0;
    const { error: ledgerErr } = await db.from('float_ledger').insert({
      merchant_id: sub.missions.merchant_id, entry_type: 'payout', amount, status: 'posted',
      reference: `PAYOUT-${sub.id}`, description: `Payout for submission in mission: ${sub.missions.name}`,
      idempotency_key: `payout-${sub.id}-${Date.now()}`, mission_id: sub.mission_id,
      created_by: user?.id, posted_by: user?.id, posted_at: new Date().toISOString(),
    });
    if (ledgerErr) { toast.error(ledgerErr.message); return; }
    const { error } = await db.from('submissions').update({ paid_at: new Date().toISOString(), payout_amount: amount }).eq('id', sub.id);
    if (error) toast.error(error.message);
    else { toast.success('Payout processed'); fetchPayouts(); }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">Payout Processing</h1>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Mission</TableHead><TableHead>Amount</TableHead><TableHead>Approved</TableHead><TableHead>Action</TableHead></TableRow></TableHeader>
          <TableBody>
            {approvedSubs.length === 0 ? (
              <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">No pending payouts</TableCell></TableRow>
            ) : approvedSubs.map(sub => (
              <TableRow key={sub.id}>
                <TableCell className="font-medium">{sub.missions?.name || '—'}</TableCell>
                <TableCell className="font-mono">${(sub.missions?.reward_per_participant || 0).toFixed(2)}</TableCell>
                <TableCell className="text-sm">{sub.reviewed_at ? new Date(sub.reviewed_at).toLocaleDateString() : '—'}</TableCell>
                <TableCell><Button size="sm" onClick={() => processPayout(sub)}>Process Payout</Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default AdminPayouts;
