import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Trophy, Clock, CheckCircle } from 'lucide-react';

interface SubmissionRow {
  id: string;
  status: string;
  payout_amount: number | null;
  paid_at: string | null;
  created_at: string;
  mission_id: string;
}

const FighterEarnings = () => {
  const { user } = useAuth();
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);

  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await db
        .from('submissions')
        .select('id, status, payout_amount, paid_at, created_at, mission_id')
        .eq('fighter_id', user.id)
        .order('created_at', { ascending: false });
      setSubmissions((data as SubmissionRow[]) || []);
    };
    fetch();
  }, [user]);

  const totalEarned = submissions
    .filter(s => s.status === 'approved')
    .reduce((sum, s) => sum + (s.payout_amount || 0), 0);

  const pendingCount = submissions.filter(s => s.status === 'pending').length;
  const approvedCount = submissions.filter(s => s.status === 'approved').length;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-display">My Earnings</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Total Earned</CardTitle>
            <Trophy className="h-5 w-5 text-green-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-display">${totalEarned.toFixed(2)}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Pending</CardTitle>
            <Clock className="h-5 w-5 text-yellow-400" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-display">{pendingCount}</div></CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm text-muted-foreground">Approved</CardTitle>
            <CheckCircle className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent><div className="text-2xl font-bold font-display">{approvedCount}</div></CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Payout</TableHead>
                <TableHead>Paid At</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {submissions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                    No submissions yet. Join a mission to start earning!
                  </TableCell>
                </TableRow>
              ) : submissions.map(s => (
                <TableRow key={s.id}>
                  <TableCell className="text-sm">{new Date(s.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Badge variant={s.status === 'approved' ? 'default' : s.status === 'rejected' ? 'destructive' : 'secondary'}>
                      {s.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono">{s.payout_amount ? `$${s.payout_amount.toFixed(2)}` : '—'}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{s.paid_at ? new Date(s.paid_at).toLocaleDateString() : '—'}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default FighterEarnings;
