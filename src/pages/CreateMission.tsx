import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/integrations/supabase/db';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Save, Rocket } from 'lucide-react';
import MissionImageUpload from '@/components/MissionImageUpload';

const steps = ['Basic Info', 'Budget & Rewards', 'Targeting', 'Evidence', 'Review'];

const CreateMission = () => {
  const { merchantId } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: '', description: '', mission_type: 'custom', budget: '', reward_per_participant: '',
    max_participants: '', start_date: '', end_date: '', evidence_type: 'photo', validation_mode: 'manual',
  });
  const [imageUrl, setImageUrl] = useState<string | null>(null);

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }));

  const buildPayload = async () => {
    const user = (await db.auth.getUser()).data.user;
    return {
      merchant_id: merchantId, name: form.name, description: form.description, mission_type: form.mission_type, image_url: imageUrl,
      budget: form.budget ? parseFloat(form.budget) : null, reward_per_participant: form.reward_per_participant ? parseFloat(form.reward_per_participant) : null,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      start_date: form.start_date || null, end_date: form.end_date || null,
      evidence_type: form.evidence_type, validation_mode: form.validation_mode, status: 'draft', created_by: user?.id,
    };
  };

  const saveDraft = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const { error } = await db.from('missions').insert(await buildPayload());
      if (error) throw error;
      toast.success('Mission saved as draft'); navigate('/merchant/missions');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  const publish = async () => {
    if (!merchantId) return;
    setLoading(true);
    try {
      const { data: mission, error: insertErr } = await db.from('missions').insert(await buildPayload()).select().single();
      if (insertErr || !mission) throw insertErr || new Error('Failed to create mission');
      const { error: pubErr } = await db.rpc('publish_mission', { _mission_id: mission.id, _idempotency_key: `publish-${mission.id}-${Date.now()}` });
      if (pubErr) throw pubErr;
      toast.success('Mission published and budget reserved!'); navigate('/merchant/missions');
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/merchant/missions')}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
        <h1 className="text-2xl font-display">Create Mission</h1>
      </div>
      <div className="flex items-center gap-2">
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
          <div className="space-y-2"><Label>Description</Label><Textarea value={form.description} onChange={e => update('description', e.target.value)} rows={4} /></div>
          <MissionImageUpload imageUrl={imageUrl} onImageChange={setImageUrl} />
          <div className="space-y-2"><Label>Mission Type</Label>
            <Select value={form.mission_type} onValueChange={v => update('mission_type', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="purchase">Purchase</SelectItem><SelectItem value="review">Review</SelectItem><SelectItem value="social">Social</SelectItem><SelectItem value="event">Event</SelectItem><SelectItem value="referral">Referral</SelectItem><SelectItem value="custom">Custom</SelectItem></SelectContent>
            </Select></div>
        </>)}
        {step === 1 && (<>
          <div className="space-y-2"><Label>Total Budget (USD)</Label><Input type="number" min="0" step="0.01" value={form.budget} onChange={e => update('budget', e.target.value)} placeholder="1000.00" /></div>
          <div className="space-y-2"><Label>Reward per Participant (USD)</Label><Input type="number" min="0" step="0.01" value={form.reward_per_participant} onChange={e => update('reward_per_participant', e.target.value)} placeholder="10.00" /></div>
          <div className="space-y-2"><Label>Max Participants</Label><Input type="number" min="1" value={form.max_participants} onChange={e => update('max_participants', e.target.value)} placeholder="100" /></div>
        </>)}
        {step === 2 && (<>
          <div className="space-y-2"><Label>Start Date</Label><Input type="datetime-local" value={form.start_date} onChange={e => update('start_date', e.target.value)} /></div>
          <div className="space-y-2"><Label>End Date</Label><Input type="datetime-local" value={form.end_date} onChange={e => update('end_date', e.target.value)} /></div>
          <p className="text-sm text-muted-foreground">Additional targeting criteria coming in Phase 2.</p>
        </>)}
        {step === 3 && (<>
          <div className="space-y-2"><Label>Evidence Type</Label>
            <Select value={form.evidence_type} onValueChange={v => update('evidence_type', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="photo">Photo</SelectItem><SelectItem value="video">Video</SelectItem><SelectItem value="receipt">Receipt</SelectItem><SelectItem value="screenshot">Screenshot</SelectItem><SelectItem value="link">Link</SelectItem><SelectItem value="text">Text</SelectItem></SelectContent>
            </Select></div>
          <div className="space-y-2"><Label>Validation Mode</Label>
            <Select value={form.validation_mode} onValueChange={v => update('validation_mode', v)}><SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="manual">Manual Review</SelectItem><SelectItem value="auto">Auto Approve</SelectItem><SelectItem value="hybrid">Hybrid</SelectItem></SelectContent>
            </Select></div>
        </>)}
        {step === 4 && (
          <div className="space-y-3">
            <h3 className="font-display text-lg">Review Mission</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-muted-foreground">Name:</span> {form.name || '—'}</div>
              <div><span className="text-muted-foreground">Type:</span> {form.mission_type}</div>
              <div><span className="text-muted-foreground">Budget:</span> ${form.budget || '0'}</div>
              <div><span className="text-muted-foreground">Reward:</span> ${form.reward_per_participant || '0'}</div>
              <div><span className="text-muted-foreground">Max Participants:</span> {form.max_participants || '∞'}</div>
              <div><span className="text-muted-foreground">Evidence:</span> {form.evidence_type}</div>
              <div><span className="text-muted-foreground">Validation:</span> {form.validation_mode}</div>
            </div>
          </div>
        )}
        <div className="flex justify-between pt-4">
          <Button variant="outline" disabled={step === 0} onClick={() => setStep(s => s - 1)}><ArrowLeft className="h-4 w-4 mr-1" /> Back</Button>
          <div className="flex gap-2">
            {step === 4 ? (<>
              <Button variant="outline" onClick={saveDraft} disabled={loading || !form.name}><Save className="h-4 w-4 mr-1" /> Save Draft</Button>
              <Button onClick={publish} disabled={loading || !form.name || !form.budget}><Rocket className="h-4 w-4 mr-1" /> Publish</Button>
            </>) : (<Button onClick={() => setStep(s => s + 1)}>Next <ArrowRight className="h-4 w-4 ml-1" /></Button>)}
          </div>
        </div>
      </CardContent></Card>
    </div>
  );
};

export default CreateMission;
