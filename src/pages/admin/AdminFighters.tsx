import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { db } from '@/integrations/supabase/db';
import { Users } from 'lucide-react';

const AdminFighters = () => {
  const [fighters, setFighters] = useState<any[]>([]);

  useEffect(() => {
    const fetchFighters = async () => {
      const { data: roles } = await db.from('user_roles').select('user_id, created_at').eq('role', 'fighter');
      const fighterIds = (roles || []).map(r => r.user_id);
      if (fighterIds.length === 0) { setFighters([]); return; }

      const { data: profiles } = await db.from('profiles').select('id, full_name, email, created_at');
      const { data: participations } = await db.from('mission_participations').select('fighter_id, status');
      const { data: submissions } = await db.from('submissions').select('fighter_id, status, payout_amount');

      const profileMap = new Map((profiles || []).map(p => [p.id, p]));

      const fighterList = fighterIds.map(id => {
        const profile = profileMap.get(id);
        const parts = (participations || []).filter(p => p.fighter_id === id);
        const subs = (submissions || []).filter(s => s.fighter_id === id);
        const approved = subs.filter(s => s.status === 'approved');
        const earnings = approved.reduce((sum, s) => sum + Number(s.payout_amount || 0), 0);
        const roleEntry = (roles || []).find(r => r.user_id === id);

        return {
          id,
          name: profile?.full_name || profile?.email || id.slice(0, 8),
          email: profile?.email || '—',
          joinedAt: roleEntry?.created_at || profile?.created_at || '',
          missions: parts.length,
          submissions: subs.length,
          approved: approved.length,
          earnings,
        };
      }).sort((a, b) => b.earnings - a.earnings);

      setFighters(fighterList);
    };
    fetchFighters();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Users className="h-6 w-6 text-primary" />
        <h1 className="text-2xl font-display">Fighters</h1>
        <Badge variant="secondary">{fighters.length}</Badge>
      </div>

      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Fighter</TableHead>
              <TableHead>Email</TableHead>
              <TableHead className="text-right">Missions</TableHead>
              <TableHead className="text-right">Submissions</TableHead>
              <TableHead className="text-right">Approved</TableHead>
              <TableHead className="text-right">Earnings</TableHead>
              <TableHead>Joined</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fighters.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No fighters registered</TableCell></TableRow>
            ) : fighters.map(f => (
              <TableRow key={f.id}>
                <TableCell className="font-medium">{f.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{f.email}</TableCell>
                <TableCell className="text-right">{f.missions}</TableCell>
                <TableCell className="text-right">{f.submissions}</TableCell>
                <TableCell className="text-right">{f.approved}</TableCell>
                <TableCell className="text-right">${f.earnings.toLocaleString()}</TableCell>
                <TableCell className="text-sm">{f.joinedAt ? new Date(f.joinedAt).toLocaleDateString() : '—'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default AdminFighters;
