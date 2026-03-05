import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Rocket } from 'lucide-react';

const steps = ['Basic Info', 'Instructions', 'Budget & Rewards', 'Targeting', 'Evidence', 'Select Merchants', 'Review'];

const AdminCreateMission = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [merchants, setMerchants] = useState<any[]>([]);
  const [selectedMerchants, setSelectedMerchants] = useState<string[]>([]);
  const [form, setForm] = useState({
    name: '', description: '', instructions: '', mission_type: 'custom', budget: '', reward_per_participant: '',
    max_participants: '', start_date: '', end_date: '', evidence_type: 'photo', validation_mode: 'manual',
  });

  useEffect(() => {
    db.from('merchants').select('id, name, status').eq('status', 'active').then(({ data }) => setMerchants(data || []));
  }, []);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const toggleMerchant = (id: string) => {
    setSelectedMerchants(prev => prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]);
  };

  const createMissions = async (publish: boolean) => {
    if (selectedMerchants.length === 0) { toast.error('Select at least one merchant'); return; }
    setLoading(true);
    try {
      const user = (await db.auth.getUser()).data.user;
      const missions = selectedMerchants.map(merchantId => ({
        merchant_id: merchantId, name: form.name, description: form.description, instructions: form.instructions || null,
        mission_type: form.mission_type,
        budget: form.budget ? parseFloat(form.budget) : null,
        reward_per_participant: form.reward_per_participant ? parseFloat(form.reward_per_participant) : null,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        start_date: form.start_date || null, end_date: form.end_date || null,
        evidence_type: form.evidence_type, validation_mode: form.validation_mode,
        status: 'draft' as const, created_by: user?.id,
      }));

      const { data, error } = await db.from('missions').insert(missions).select();
      if (error) throw error;

      if (publish && data) {
        for (const mission of data) {
          const { error: pubErr } = await db.rpc('publish_mission', {
            _mission_id: mission.id,
            _idempotency_key: `publish-${mission.id}-${Date.now()}`
          });
          if (pubErr) { toast.error(`Failed to publish for merchant: ${pubErr.message}`); }
        }
      }

      toast.success(`${data?.length || 0} mission(s) created for ${selectedMerchants.length} merchant(s)`);
      navigate('/admin/missions');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/admin/missions')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-2xl font-display">Create Mission (Admin)</h1>
      </div>

      <div className="flex items-center gap-2 flex-wrap">
        {steps.map((s, i) => (
          <div key={s} className="flex items-center gap-2">
            <button onClick={() => setStep(i)} className={`text-xs px-3 py-1 rounded-full transition-colors ${i === step ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'}`}>{s}</button>
            {i < steps.length - 1 && <div className="w-6 h-px bg-border" />}
          </div>
        ))}
      </div>

      <Card><CardContent className="pt-6 space-y-4">
        {step === 0 && (<>
          <div className="space-y-2"><Label>Mission Name</Label><Input value={form.name} onChange={e => update('name', e.target.value)} placeholder="e.g. Summer Gym Challenge" /></div>
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={3} placeholder="Brief description of the mission" /></div>
          <div className="space-y-2"><Label>Mission Type</Label>
            <Select value={form.mission_type} onValueChange={v => update('mission_type', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="social">Social</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
            </Select></div>
        </>)}
        {step === 1 && (<>
          <div className="space-y-2">
            <Label>Fighter Instructions</Label>
            <p className="text-xs text-muted-foreground">Step-by-step instructions that fighters will see when they open this mission. Use numbered steps.</p>
            <Textarea value={form.instructions} onChange={e => update('instructions', e.target.value)} rows={6} placeholder={"1. Go to the merchant's location\n2. Complete the required action\n3. Take a photo as proof\n4. Upload the evidence"} />
          </div>
        </>)}
        {step === 2 && (<>
          <div className="space-y-2"><Label>Total Budget (USD) per Merchant</Label><Input type="number" min="0" step="0.01" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="1000.00" /></div>
          <div className="space-y-2"><Label>Reward per Participant (USD)</Label><Input type="number" min="0" step="0.01" value={form.reward_per_participant} onChange={e => update('reward_per_participant', e.target.value)} placeholder="10.00" /></div>
          <div className="space-y-2"><Label>Max Participants</Label><Input type="number" min="1" value={form.max_participants} onChange={e => update('max_participants', e.target.value)} placeholder="100" /></div>
        </>)}
        {step === 3 && (<>
          <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.start_date} onChange={e => update('start_date', e.target.value)} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.end_date} onChange={e => update('end_date', e.target.value)} /></div>
        </>)}
        {step === 4 && (<>
          <div className="space-y-2"><Label>Evidence Type</Label>
            <Select value={form.evidence_type} onValueChange={v => update('evidence_type', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="photo">Photo</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="receipt">Receipt</SelectItem><SelectItem value="screenshot">Screenshot</SelectItem><SelectItem value="link">Link</SelectItem><SelectItem value="text">Text</SelectItem></SelectContent>
            </Select></div>
          <div className="space-y-2"><Label>Validation Mode</Label>
            <Select value={form.validation_mode} onValueChange={v => update('validation_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="manual">Manual Review</SelectItem><SelectItem value="auto">Auto Approve</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
            </Select></div>
        </>)}
        {step === 5 && (
          <div className="space-y-3">
            <h3 className="font-display text-lg">Select Merchants</h3>
            <p className="text-sm text-muted-foreground">A copy of this mission will be created for each selected merchant.</p>
            {merchants.length === 0 ? (
              <p className="text-sm text-muted-foreground">No active merchants found.</p>
            ) : (
              <div className="space-y-2">
                {merchants.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-3 rounded-md border border-border hover:bg-accent/50 cursor-pointer transition-colors">
                    <Checkbox checked={selectedMerchants.includes(m.id)} onCheckedChange={() => toggleMerchant(m.id)} />
                    <span className="font-medium">{m.name}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        )}
        {step === 6 && (
          <div className="space-y-3">
            <h3 className="font-display text-lg">Review Mission</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {form.name || '—'}</div>
              <div><span className="text-muted-foreground">Type:</span> {form.mission_type}</div>
              <div><span className="text-muted-foreground">Budget/Merchant:</span> ${form.budget || '0'}</div>
              <div><span className="text-muted-foreground">Reward:</span> ${form.reward_per_participant || '0'}</div>
              <div><span className="text-muted-foreground">Max Participants:</span> {form.max_participants || '∞'}</div>
              <div><span className="text-muted-foreground">Evidence:</span> {form.evidence_type}</div>
              <div><span className="text-muted-foreground">Validation:</span> {form.validation_mode}</div>
              <div><span className="text-muted-foreground">Merchants:</span> {selectedMerchants.length} selected</div>
            </div>
            {form.instructions && (
              <div className="mt-2">
                <p className="text-sm text-muted-foreground">Fighter Instructions:</p>
                <pre className="text-sm whitespace-pre-wrap bg-secondary p-3 rounded-md mt-1">{form.instructions}</pre>
              </div>
            )}
            <div className="mt-2">
              <p className="text-sm text-muted-foreground">Selected merchants:</p>
              <div className="flex flex-wrap gap-2 mt-1">
                {selectedMerchants.map(id => {
                  const m = merchants.find(m => m.id === id);
                  return <span key={id} className="text-xs bg-secondary px-2 py-1 rounded">{m?.name || id}</span>;
                })}
              </div>
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div className="flex gap-2">
            {step === steps.length - 1 ? (<>
              <Button variant="outline" onClick={() => createMissions(false)} disabled={loading || !form.name}><Save className="h-4 w-4 mr-1" /> Save as Drafts</Button>
              <Button onClick={() => createMissions(true)} disabled={loading || !form.name || !form.budget}><Rocket className="h-4 w-4 mr-1" /> Publish All</Button>
            </>) : (<Button onClick={() => setStep(s => s + 1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>)}
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
};

export default AdminCreateMission;
