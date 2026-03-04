import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';

const AdminReviews = () => {
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [selected, setSelected] = useState<string[]>([]);

  const fetchSubmissions = async () => {
    const { data } = await db.from('submissions').select('*, missions(name, merchant_id)').eq('status', 'pending').order('created_at', { ascending: false });
    setSubmissions(data || []);
  };

  useEffect(() => { fetchSubmissions(); }, []);

  const toggleSelect = (id: string) => setSelected(prev => prev.includes(id) ? prev.filter(s => s !== id) : [...prev, id]);

  const reviewSubmission = async (id: string, status: 'approved' | 'rejected') => {
    const user = (await db.auth.getUser()).data.user;
    const { error } = await db.from('submissions').update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(`Submission ${status}`); fetchSubmissions(); }
  };

  const batchAction = async (status: 'approved' | 'rejected') => {
    const user = (await db.auth.getUser()).data.user;
    for (const id of selected) {
      await db.from('submissions').update({ status, reviewed_by: user?.id, reviewed_at: new Date().toISOString() }).eq('id', id);
    }
    toast.success(`${selected.length} submissions ${status}`);
    setSelected([]); fetchSubmissions();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Review Queue</h1>
        {selected.length > 0 && (
          <div className="flex gap-2">
            <Button size="sm" onClick={() => batchAction('approved')}>Approve ({selected.length})</Button>
            <Button size="sm" variant="destructive" onClick={() => batchAction('rejected')}>Reject ({selected.length})</Button>
          </div>
        )}
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead className="w-10"></TableHead><TableHead>Mission</TableHead><TableHead>Evidence</TableHead><TableHead>Date</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {submissions.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No pending submissions</TableCell></TableRow>
            ) : submissions.map(sub => (
              <TableRow key={sub.id}>
                <TableCell><Checkbox checked={selected.includes(sub.id)} onCheckedChange={() => toggleSelect(sub.id)} /></TableCell>
                <TableCell className="font-medium">{sub.missions?.name || '—'}</TableCell>
                <TableCell className="text-sm">{sub.evidence_type || '—'}</TableCell>
                <TableCell className="text-sm">{new Date(sub.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="sm" onClick={() => reviewSubmission(sub.id, 'approved')}>Approve</Button>
                    <Button size="sm" variant="destructive" onClick={() => reviewSubmission(sub.id, 'rejected')}>Reject</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default AdminReviews;
