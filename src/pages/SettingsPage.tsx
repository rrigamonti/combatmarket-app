import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';

const SettingsPage = () => {
  const { merchantId, user } = useAuth();
  const [merchant, setMerchant] = useState<any>(null);
  const [name, setName] = useState('');
  const [website, setWebsite] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!merchantId) return;
    db.from('merchants').select('*').eq('id', merchantId).single().then(({ data }) => {
      if (data) { setMerchant(data); setName(data.name); setWebsite(data.website || ''); }
    });
  }, [merchantId]);

  const handleSave = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const { error } = await db.from('merchants').update({ name, website, updated_at: new Date().toISOString() }).eq('id', merchantId);
      if (error) throw error;
      toast.success('Settings saved');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-2xl">
      <h1 className="text-2xl font-display">Settings</h1>
      <Card><CardHeader><CardTitle className="font-display text-lg">Account</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><Label className="text-muted-foreground">Email</Label><p className="text-sm">{user?.email}</p></div>
          {merchant && <div><Label className="text-muted-foreground">Status</Label><div><Badge>{merchant.status}</Badge></div></div>}
        </CardContent>
      </Card>
      {merchantId && (
        <Card><CardHeader><CardTitle className="font-display text-lg">Merchant Details</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2"><Label>Brand Name</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
            <div className="space-y-2"><Label>Website</Label><Input value={website} onChange={e => setWebsite(e.target.value)} placeholder="https://" /></div>
            <Button onClick={handleSave} disabled={loading}>{loading ? 'Saving...' : 'Save Changes'}</Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SettingsPage;
