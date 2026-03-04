import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { ArrowLeft, Pause, Play, XCircle } from 'lucide-react';

const MissionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [mission, setMission] = useState<any>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchMission = async () => {
    if (!id) return;
    const { data } = await db.from('missions').select('*').eq('id', id).single();
    setMission(data);
    const { data: subs } = await db.from('submissions').select('*').eq('mission_id', id).order('created_at', { ascending: false });
    setSubmissions(subs || []);
  };

  useEffect(() => { fetchMission(); }, [id]);

  const updateStatus = async (newStatus: string) => {
    setLoading(true);
    try {
      const { error } = await db.from('missions').update({ status: newStatus, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      if (newStatus === 'closed' && mission) {
        const paidOut = submissions.filter(s => s.status === 'approved').reduce((sum: number, s: any) => sum + (s.payout_amount || 0), 0);
        const unusedBudget = (mission.budget || 0) - paidOut;
        if (unusedBudget > 0) {
          await db.from('float_ledger').insert({
            merchant_id: mission.merchant_id, entry_type: 'release', amount: unusedBudget, status: 'posted',
            reference: `RELEASE-${id}`, description: `Unused budget released from mission: ${mission.name}`,
            idempotency_key: `release-${id}-${Date.now()}`, mission_id: id,
          });
        }
      }
      toast.success(`Mission ${newStatus}`); fetchMission();
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const reviewSubmission = async (subId: string, status: 'approved' | 'rejected') => {
    const user = (await db.auth.getUser()).data.user;
    const { error } = await db.from('submissions').update({
      status, reviewed_by: user?.id, reviewed_at: new Date().toISOString(),
      payout_amount: status === 'approved' ? mission?.reward_per_participant : null,
    }).eq('id', subId);
    if (error) toast.error(error.message);
    else { toast.success(`Submission ${status}`); fetchMission(); }
  };

  if (!mission) return <div className="text-center py-12 text-muted-foreground">Loading...</div>;
  const paidOut = submissions.filter(s => s.status === 'approved').reduce((s: number, sub: any) => s + (sub.payout_amount || 0), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/missions')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-2xl font-display">{mission.name}</h1>
        <Badge variant={mission.status === 'active' ? 'default' : 'secondary'}>{mission.status}</Badge>
      </div>
      {['active', 'paused'].includes(mission.status) && (
        <div className="flex gap-2">
          {mission.status === 'active' && <Button variant="outline" onClick={() => updateStatus('paused')} disabled={loading}><Pause className="h-4 w-4 mr-1" /> Pause</Button>}
          {mission.status === 'paused' && <Button variant="outline" onClick={() => updateStatus('active')} disabled={loading}><Play className="h-4 w-4 mr-1" /> Resume</Button>}
          <Button variant="destructive" onClick={() => updateStatus('closed')} disabled={loading}><XCircle className="h-4 w-4 mr-1" /> Close</Button>
        </div>
      )}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Budget</CardTitle></CardHeader><CardContent><div className="text-xl font-bold font-display">${(mission.budget || 0).toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Spent</CardTitle></CardHeader><CardContent><div className="text-xl font-bold font-display text-primary">${paidOut.toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Remaining</CardTitle></CardHeader><CardContent><div className="text-xl font-bold font-display text-green-400">${((mission.budget || 0) - paidOut).toFixed(2)}</div></CardContent></Card>
        <Card><CardHeader className="pb-2"><CardTitle className="text-sm text-muted-foreground">Participants</CardTitle></CardHeader><CardContent><div className="text-xl font-bold font-display">{mission.current_participants}/{mission.max_participants || '∞'}</div></CardContent></Card>
      </div>
      <Card>
        <CardHeader><CardTitle className="font-display text-lg">Submissions</CardTitle></CardHeader>
        <CardContent>
          <Table>
            <TableHeader><TableRow><TableHead>Date</TableHead><TableHead>Evidence</TableHead><TableHead>Status</TableHead><TableHead>Payout</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No submissions yet</TableCell></TableRow>
              ) : submissions.map(sub => (
                <TableRow key={sub.id}>
                  <TableCell className="text-sm">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                  <TableCell className="text-sm">{sub.evidence_type || '—'}</TableCell>
                  <TableCell><Badge>{sub.status}</Badge></TableCell>
                  <TableCell className="font-mono">{sub.payout_amount ? `$${sub.payout_amount.toFixed(2)}` : '—'}</TableCell>
                  <TableCell>{sub.status === 'pending' && (
                    <div className="flex gap-1">
                      <Button size="sm" onClick={() => reviewSubmission(sub.id, 'approved')}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reviewSubmission(sub.id, 'rejected')}>Reject</Button>
                    </div>
                  )}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default MissionDetail;
