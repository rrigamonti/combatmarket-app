import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Plus, Search, Eye } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Mission { id: string; name: string; status: string; mission_type: string; budget: number | null; max_participants: number | null; current_participants: number; created_at: string; }

const MissionsPage = () => {
  const { merchantId } = useAuth();
  const navigate = useNavigate();
  const [missions, setMissions] = useState<Mission[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!merchantId) return;
    const fetchMissions = async () => {
      let query = db.from('missions').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
      if (filterStatus !== 'all') query = query.eq('status', filterStatus);
      if (search) query = query.ilike('name', `%${search}%`);
      const { data } = await query;
      setMissions((data as Mission[]) || []);
    };
    fetchMissions();
  }, [merchantId, filterStatus, search]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Missions</h1>
        <Button onClick={() => navigate('/merchant/missions/create')}><Plus className="h-4 w-4 mr-1" /> Create Mission</Button>
      </div>
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search missions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Status</SelectItem><SelectItem value="draft">Draft</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="paused">Paused</SelectItem><SelectItem value="closed">Closed</SelectItem></SelectContent>
        </Select>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Mission</TableHead><TableHead>Type</TableHead><TableHead>Status</TableHead><TableHead>Budget</TableHead><TableHead>Participants</TableHead><TableHead>Created</TableHead><TableHead></TableHead></TableRow></TableHeader>
          <TableBody>
            {missions.length === 0 ? (
              <TableRow><TableCell colSpan={7} className="text-center text-muted-foreground py-8">No missions yet. Create your first mission!</TableCell></TableRow>
            ) : missions.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-sm uppercase text-muted-foreground">{m.mission_type}</TableCell>
                <TableCell><Badge variant={m.status === 'active' ? 'default' : 'secondary'}>{m.status}</Badge></TableCell>
                <TableCell className="font-mono">{m.budget ? `$${m.budget.toFixed(2)}` : '—'}</TableCell>
                <TableCell>{m.current_participants}/{m.max_participants || '∞'}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                <TableCell><Button variant="ghost" size="icon" onClick={() => navigate(`/merchant/missions/${m.id}`)}><Eye className="h-4 w-4" /></Button></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent></Card>
    </div>
  );
};

export default MissionsPage;
