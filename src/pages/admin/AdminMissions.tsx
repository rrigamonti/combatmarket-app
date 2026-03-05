import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/integrations/supabase/db';
import { Plus } from 'lucide-react';

const statusColors: Record<string, string> = {
  draft: 'bg-secondary text-secondary-foreground',
  active: 'bg-green-500/20 text-green-400',
  paused: 'bg-yellow-500/20 text-yellow-400',
  closed: 'bg-muted text-muted-foreground',
  scheduled: 'bg-blue-500/20 text-blue-400',
};

const AdminMissions = () => {
  const navigate = useNavigate();
  const [missions, setMissions] = useState<any[]>([]);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    const fetchData = async () => {
      const { data: m } = await db.from('merchants').select('id, name');
      setMerchants(m || []);

      let query = db.from('missions').select('*').order('created_at', { ascending: false });
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      const { data } = await query;
      setMissions(data || []);
    };
    fetchData();
  }, [filterStatus]);

  const merchantName = (id: string) => merchants.find(m => m.id === id)?.name || '—';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-display">All Missions</h1>
        <div className="flex gap-2">
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-36"><SelectValue placeholder="Status" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="draft">Draft</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="paused">Paused</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={() => navigate('/admin/missions/create')}><Plus className="h-4 w-4 mr-1" /> Create Mission</Button>
        </div>
      </div>

      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Mission</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Budget</TableHead>
              <TableHead>Participants</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {missions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No missions found</TableCell></TableRow>
            ) : missions.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-sm">{merchantName(m.merchant_id)}</TableCell>
                <TableCell><Badge variant="outline" className="text-xs">{m.mission_type}</Badge></TableCell>
                <TableCell><Badge className={statusColors[m.status] || ''}>{m.status}</Badge></TableCell>
                <TableCell className="text-sm">${m.budget?.toLocaleString() || '—'}</TableCell>
                <TableCell className="text-sm">{m.current_participants || 0}/{m.max_participants || '∞'}</TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" onClick={() => navigate(`/admin/missions/${m.id}`)}>
                    Manage
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default AdminMissions;
