import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';

const AdminMerchants = () => {
  const [merchants, setMerchants] = useState<any[]>([]);
  const [filterStatus, setFilterStatus] = useState('all');

  const fetchMerchants = async () => {
    let query = db.from('merchants').select('*').order('created_at', { ascending: false });
    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    const { data } = await query;
    setMerchants(data || []);
  };

  useEffect(() => { fetchMerchants(); }, [filterStatus]);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await db.from('merchants').update({ status, updated_at: new Date().toISOString() }).eq('id', id);
    if (error) toast.error(error.message);
    else { toast.success(`Merchant ${status}`); fetchMerchants(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-display">Merchant Management</h1>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-40"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All</SelectItem><SelectItem value="pending">Pending</SelectItem><SelectItem value="active">Active</SelectItem><SelectItem value="suspended">Suspended</SelectItem></SelectContent>
        </Select>
      </div>
      <Card><CardContent className="pt-6">
        <Table>
          <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Website</TableHead><TableHead>Status</TableHead><TableHead>Created</TableHead><TableHead>Actions</TableHead></TableRow></TableHeader>
          <TableBody>
            {merchants.length === 0 ? (
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">No merchants</TableCell></TableRow>
            ) : merchants.map(m => (
              <TableRow key={m.id}>
                <TableCell className="font-medium">{m.name}</TableCell>
                <TableCell className="text-sm text-muted-foreground">{m.website || '—'}</TableCell>
                <TableCell><Badge>{m.status}</Badge></TableCell>
                <TableCell className="text-sm">{new Date(m.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {m.status !== 'active' && <Button size="sm" onClick={() => updateStatus(m.id, 'active')}>Activate</Button>}
                    {m.status !== 'suspended' && <Button size="sm" variant="destructive" onClick={() => updateStatus(m.id, 'suspended')}>Suspend</Button>}
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

export default AdminMerchants;
